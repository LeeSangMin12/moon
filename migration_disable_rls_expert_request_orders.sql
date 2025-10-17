-- expert_request_orders 테이블의 RLS 비활성화

-- RLS 비활성화
ALTER TABLE expert_request_orders DISABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 모두 삭제
DROP POLICY IF EXISTS "Users can view their own orders" ON expert_request_orders;
DROP POLICY IF EXISTS "Requesters can create orders" ON expert_request_orders;
DROP POLICY IF EXISTS "Experts can update their orders" ON expert_request_orders;
DROP POLICY IF EXISTS "Requesters can update their orders" ON expert_request_orders;

-- 확인
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'expert_request_orders';
