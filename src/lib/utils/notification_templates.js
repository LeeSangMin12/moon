/**
 * 푸시 알림 메시지 템플릿
 * 각 알림 타입별로 제목, 본문, 아이콘을 정의
 */

/**
 * 알림 타입별 템플릿
 * - title: 알림 제목 (변수: {actor_name}, {post_title} 등)
 * - body: 알림 본문
 * - icon: 알림 아이콘 (안드로이드)
 * - sound: 알림 소리
 */
export const NOTIFICATION_TEMPLATES = {
	'post.liked': {
		title: '{actor_name}님이 게시글을 좋아합니다',
		body: '{post_title}',
		icon: '👍',
		sound: 'default'
	},
	'service.liked': {
		title: '{actor_name}님이 서비스를 좋아합니다',
		body: '{service_title}',
		icon: '❤️',
		sound: 'default'
	},
	'comment.created': {
		title: '{actor_name}님이 댓글을 남겼습니다',
		body: '{preview}',
		icon: '💬',
		sound: 'default'
	},
	'comment.reply': {
		title: '{actor_name}님이 답글을 남겼습니다',
		body: '{preview}',
		icon: '↩️',
		sound: 'default'
	},
	'follow.created': {
		title: '{actor_name}님이 팔로우하기 시작했습니다',
		body: '프로필을 확인해보세요',
		icon: '👤',
		sound: 'default'
	},
	'order.created': {
		title: '새로운 주문이 접수되었습니다',
		body: '{service_title} - 주문을 확인해주세요',
		icon: '📦',
		sound: 'default'
	},
	'order.approved': {
		title: '주문이 승인되었습니다',
		body: '{service_title} - 서비스가 곧 시작됩니다',
		icon: '✅',
		sound: 'default'
	},
	'order.completed': {
		title: '서비스가 완료되었습니다',
		body: '{service_title} - 리뷰를 남겨주세요',
		icon: '🎉',
		sound: 'default'
	},
	'order.cancelled': {
		title: '주문이 취소되었습니다',
		body: '{service_title}',
		icon: '❌',
		sound: 'default'
	},
	'review.created': {
		title: '{actor_name}님이 리뷰를 남겼습니다',
		body: '{title} - {service_title}',
		icon: '⭐',
		sound: 'default'
	},
	'expert_review.created': {
		title: '{actor_name}님이 전문가 리뷰를 남겼습니다',
		body: '{title} - 별점: {rating}점',
		icon: '⭐',
		sound: 'default'
	},
	'proposal.accepted': {
		title: '제안이 수락되었습니다',
		body: '{request_title} - 채팅을 시작하세요',
		icon: '🤝',
		sound: 'default'
	},
	'gift.received': {
		title: '선물을 받았습니다',
		body: '{actor_name}님이 {amount}원을 선물했습니다',
		icon: '🎁',
		sound: 'default'
	},
	'coffee_chat.requested': {
		title: '{actor_name}님이 커피챗을 신청했습니다',
		body: '{subject}',
		icon: '☕',
		sound: 'default'
	},
	'coffee_chat.accepted': {
		title: '커피챗이 수락되었습니다',
		body: '{recipient_name}님이 커피챗을 수락했습니다',
		icon: '✅',
		sound: 'default'
	},
	'coffee_chat.rejected': {
		title: '커피챗이 거절되었습니다',
		body: '{recipient_name}님이 커피챗을 거절했습니다',
		icon: '❌',
		sound: 'default'
	}
};

/**
 * 템플릿 변수를 실제 값으로 치환
 * @param {string} template - 템플릿 문자열 (예: "{actor_name}님이 좋아합니다")
 * @param {object} variables - 치환할 변수 객체 (예: { actor_name: "홍길동" })
 * @returns {string} - 치환된 문자열
 */
export function replace_template_variables(template, variables) {
	let result = template;
	for (const [key, value] of Object.entries(variables)) {
		result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
	}
	return result;
}

/**
 * 알림 타입에 맞는 푸시 메시지 생성
 * @param {string} type - 알림 타입 (예: "post.liked")
 * @param {string} actor_name - 행동 주체 이름
 * @param {object} payload - 알림 페이로드 (추가 데이터)
 * @returns {object} - { title, body, icon, sound }
 */
export function create_push_message(type, actor_name, payload = {}) {
	const template = NOTIFICATION_TEMPLATES[type];

	if (!template) {
		console.warn(`⚠️ Unknown notification type: ${type}`);
		return {
			title: '새 알림',
			body: '확인해보세요',
			icon: '🔔',
			sound: 'default'
		};
	}

	const variables = {
		actor_name,
		...payload
	};

	return {
		title: replace_template_variables(template.title, variables),
		body: replace_template_variables(template.body, variables),
		icon: template.icon,
		sound: template.sound
	};
}
