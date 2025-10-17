-- expert_request_orders 삭제하고 expert_requests에 통합

-- 1. expert_requests 테이블에 입금 정보 컬럼 추가
ALTER TABLE expert_requests
ADD COLUMN IF NOT EXISTS depositor_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS requester_contact VARCHAR(200),
ADD COLUMN IF NOT EXISTS special_request TEXT,
ADD COLUMN IF NOT EXISTS order_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS order_completed_at TIMESTAMPTZ;

-- 2. 제약 조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_status'
  ) THEN
    ALTER TABLE expert_requests
    ADD CONSTRAINT chk_order_status
    CHECK (order_status IS NULL OR order_status IN ('pending', 'paid', 'completed', 'cancelled', 'refunded'));
  END IF;
END $$;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_expert_requests_order_status ON expert_requests(order_status) WHERE order_status IS NOT NULL;

-- 4. 코멘트 추가
COMMENT ON COLUMN expert_requests.depositor_name IS '입금자명';
COMMENT ON COLUMN expert_requests.bank IS '은행';
COMMENT ON COLUMN expert_requests.account_number IS '계좌번호';
COMMENT ON COLUMN expert_requests.requester_contact IS '의뢰인 연락처';
COMMENT ON COLUMN expert_requests.special_request IS '특별 요청사항';
COMMENT ON COLUMN expert_requests.order_status IS '주문 상태: pending(입금대기), paid(입금완료), completed(완료), cancelled(취소)';
COMMENT ON COLUMN expert_requests.paid_at IS '입금 승인 시간';
COMMENT ON COLUMN expert_requests.order_completed_at IS '주문 완료 시간';

-- 5. expert_request_orders 테이블 삭제
DROP TABLE IF EXISTS expert_request_orders CASCADE;

-- 완료
SELECT 'Integration completed! expert_request_orders deleted, columns added to expert_requests' as status;
