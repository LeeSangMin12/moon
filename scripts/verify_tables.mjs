import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xgnnhfmpporixibxpeas.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhnbm5oZm1wcG9yaXhpYnhwZWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTUxNjEsImV4cCI6MjA2MzUzMTE2MX0.LMIsrSeaA7T_k81dqvYSX8jCaStOo4HjOTs8AidSUbk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyTables() {
  try {
    console.log('=== 전문가 테이블 확인 ===\\n')
    
    // expert_requests 테이블 확인
    console.log('1. expert_requests 테이블 확인...')
    const { data: requests, error: requestsError, count: requestsCount } = await supabase
      .from('expert_requests')
      .select('*', { count: 'exact' })
    
    if (requestsError) {
      console.log('❌ expert_requests 테이블 접근 실패')
      console.log('오류:', requestsError.message)
    } else {
      console.log('✅ expert_requests 테이블 정상 동작')
      console.log(`총 레코드 수: ${requestsCount || 0}개`)
      if (requests && requests.length > 0) {
        console.log('샘플 데이터:', requests[0].title)
      }
    }
    
    // expert_request_proposals 테이블 확인
    console.log('\\n2. expert_request_proposals 테이블 확인...')
    const { data: proposals, error: proposalsError, count: proposalsCount } = await supabase
      .from('expert_request_proposals')
      .select('*', { count: 'exact' })
    
    if (proposalsError) {
      console.log('❌ expert_request_proposals 테이블 접근 실패')
      console.log('오류:', proposalsError.message)
    } else {
      console.log('✅ expert_request_proposals 테이블 정상 동작')
      console.log(`총 레코드 수: ${proposalsCount || 0}개`)
    }
    
    // API 호출 테스트
    console.log('\\n3. API 호출 테스트...')
    const { data: joinedData, error: joinError } = await supabase
      .from('expert_requests')
      .select(`
        *,
        users:requester_id(id, handle, name, avatar_url),
        expert_request_proposals(count)
      `)
      .limit(3)
    
    if (joinError) {
      console.log('❌ JOIN 쿼리 실패')
      console.log('오류:', joinError.message)
    } else {
      console.log('✅ JOIN 쿼리 정상 동작')
      console.log(`조회된 데이터: ${joinedData ? joinedData.length : 0}개`)
    }
    
    console.log('\\n=== 확인 완료 ===')
    console.log('모든 테이블이 정상적으로 생성되었다면 /service 페이지에서 전문가 찾기 기능을 사용할 수 있습니다.')
    
  } catch (error) {
    console.error('확인 중 오류 발생:', error.message)
  }
}

verifyTables()