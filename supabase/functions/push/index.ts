import { createClient } from 'npm:@supabase/supabase-js@2'
import { JWT } from 'npm:google-auth-library@9'

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    recipient_id: string
    actor_id: string | null
    type: string
    payload: any
    link_url: string | null
  }
  schema: 'public'
}

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Firebase Service Account (환경 변수에서 로드)
const serviceAccount = {
  project_id: Deno.env.get('FIREBASE_PROJECT_ID')!,
  client_email: Deno.env.get('FIREBASE_CLIENT_EMAIL')!,
  private_key: Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n'),
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()

    // actor_id가 없으면 시스템 알림이므로 푸시 발송 안 함
    if (!payload.record.actor_id) {
      return new Response(JSON.stringify({ success: true, skipped: 'no_actor' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 1. 알림 설정 확인
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', payload.record.recipient_id)
      .single()

    if (!settings?.push_enabled) {
      return new Response(JSON.stringify({ success: true, skipped: 'push_disabled' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 타입별 설정 확인
    const typeKey = payload.record.type.replace('.', '_')
    if (settings[typeKey] === false) {
      return new Response(JSON.stringify({ success: true, skipped: 'type_disabled' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Actor 정보 조회
    const { data: actor } = await supabase
      .from('users')
      .select('name, handle')
      .eq('id', payload.record.actor_id)
      .single()

    const actorName = actor?.name || actor?.handle || '알 수 없음'

    // 3. FCM 토큰 조회
    const { data: devices } = await supabase
      .from('user_devices')
      .select('fcm_token, device_type')
      .eq('user_id', payload.record.recipient_id)

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: 'no_devices' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 4. 푸시 메시지 생성
    const { title, body } = createPushMessage(payload.record.type, actorName, payload.record.payload)

    // 5. Access Token 생성
    const accessToken = await getAccessToken({
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    })

    // 6. 각 디바이스에 푸시 발송
    const results = await Promise.allSettled(
      devices.map(async (device) => {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token: device.fcm_token,
                notification: { title, body },
                data: {
                  type: payload.record.type,
                  link_url: payload.record.link_url || '',
                },
                android: {
                  notification: { sound: 'default' },
                },
                apns: {
                  payload: {
                    aps: {
                      alert: { title, body },
                      sound: 'default',
                    },
                  },
                },
              },
            }),
          }
        )

        const resData = await res.json()

        // FCM 토큰이 유효하지 않으면 삭제
        if (res.status >= 400) {
          if (
            resData.error?.status === 'UNREGISTERED' ||
            resData.error?.status === 'INVALID_ARGUMENT' ||
            resData.error?.message?.includes('registration-token')
          ) {
            await supabase
              .from('user_devices')
              .delete()
              .eq('fcm_token', device.fcm_token)
          }
          throw resData
        }

        return resData
      })
    )

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

// 푸시 메시지 템플릿
function createPushMessage(type: string, actorName: string, payload: any) {
  const templates: Record<string, { title: string; body: string }> = {
    'post.liked': {
      title: `${actorName}님이 게시글을 좋아합니다`,
      body: payload?.post_title || '게시글',
    },
    'service.liked': {
      title: `${actorName}님이 서비스를 좋아합니다`,
      body: payload?.service_title || '서비스',
    },
    'comment.created': {
      title: `${actorName}님이 댓글을 남겼습니다`,
      body: payload?.comment_content || '새 댓글',
    },
    'comment.reply': {
      title: `${actorName}님이 답글을 남겼습니다`,
      body: payload?.comment_content || '새 답글',
    },
    'follow.created': {
      title: `${actorName}님이 팔로우하기 시작했습니다`,
      body: '프로필을 확인해보세요',
    },
    'order.created': {
      title: `${actorName}님이 주문했습니다`,
      body: payload?.service_title || '새 주문',
    },
    'order.approved': {
      title: '주문이 승인되었습니다',
      body: payload?.service_title || '주문 승인',
    },
    'order.completed': {
      title: '서비스가 완료되었습니다',
      body: payload?.service_title || '서비스 완료',
    },
    'review.created': {
      title: `${actorName}님이 리뷰를 남겼습니다`,
      body: payload?.review_content || '새 리뷰',
    },
    'expert_review.created': {
      title: `${actorName}님이 전문가 리뷰를 남겼습니다`,
      body: payload?.review_content || '새 전문가 리뷰',
    },
    'proposal.accepted': {
      title: '제안이 수락되었습니다',
      body: payload?.request_title || '제안 수락',
    },
    'gift.received': {
      title: `${actorName}님이 선물을 보냈습니다`,
      body: `${payload?.gift_amount || 0}문 선물`,
    },
    'coffee_chat.requested': {
      title: `${actorName}님이 커피챗을 요청했습니다`,
      body: '요청을 확인해보세요',
    },
    'coffee_chat.accepted': {
      title: '커피챗이 수락되었습니다',
      body: `${actorName}님과의 커피챗`,
    },
    'coffee_chat.rejected': {
      title: '커피챗이 거절되었습니다',
      body: `${actorName}님의 커피챗`,
    },
  }

  return templates[type] || { title: '새 알림', body: actorName }
}

// Firebase Access Token 생성
const getAccessToken = ({
  clientEmail,
  privateKey,
}: {
  clientEmail: string
  privateKey: string
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    })
    jwtClient.authorize((err, tokens) => {
      if (err) {
        reject(err)
        return
      }
      resolve(tokens!.access_token!)
    })
  })
}
