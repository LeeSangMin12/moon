-- expert_requests를 공고 등록비 모델로 단순화

-- 1. 불필요한 입금/정산 관련 컬럼 제거
ALTER TABLE expert_requests
DROP COLUMN IF EXISTS depositor_name,
DROP COLUMN IF EXISTS bank,
DROP COLUMN IF EXISTS account_number,
DROP COLUMN IF EXISTS requester_contact,
DROP COLUMN IF EXISTS special_request,
DROP COLUMN IF EXISTS order_status,
DROP COLUMN IF EXISTS paid_at,
DROP COLUMN IF EXISTS order_completed_at,
DROP COLUMN IF EXISTS total_with_commission,
DROP COLUMN IF EXISTS commission_amount;

-- 2. 공고 등록비 관련 컬럼 추가
ALTER TABLE expert_requests
ADD COLUMN IF NOT EXISTS selected_expert_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_amount INTEGER DEFAULT 4900;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_expert_requests_selected_expert
ON expert_requests(selected_expert_id)
WHERE selected_expert_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expert_requests_is_paid
ON expert_requests(is_paid)
WHERE is_paid = true;

-- 4. status 필드에 'draft', 'pending_payment' 추가 (기존 체크 제약조건 업데이트)
DO $$
BEGIN
  -- 기존 status 제약조건 제거
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expert_requests_status_check'
  ) THEN
    ALTER TABLE expert_requests DROP CONSTRAINT expert_requests_status_check;
  END IF;

  -- 새로운 status 제약조건 추가 (draft, pending_payment 포함)
  ALTER TABLE expert_requests
  ADD CONSTRAINT expert_requests_status_check
  CHECK (status IN ('draft', 'pending_payment', 'open', 'in_progress', 'completed', 'closed', 'cancelled'));
END $$;

-- 5. order_status 제약 조건 제거
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_status'
  ) THEN
    ALTER TABLE expert_requests DROP CONSTRAINT chk_order_status;
  END IF;
END $$;

-- 6. 코멘트 추가
COMMENT ON COLUMN expert_requests.selected_expert_id IS '선택된 전문가 (프로젝트 진행자)';
COMMENT ON COLUMN expert_requests.is_paid IS '공고 등록비 결제 완료 여부';
COMMENT ON COLUMN expert_requests.registration_paid_at IS '공고 등록비 결제 시간';
COMMENT ON COLUMN expert_requests.registration_amount IS '공고 등록비 (기본 4,900원)';
COMMENT ON COLUMN expert_requests.status IS '공고 상태: draft(작성중), pending_payment(입금대기), open(모집중), in_progress(진행중), completed(완료), closed(마감), cancelled(취소)';

-- 완료
SELECT 'Expert requests simplified! Removed order/payment fields, added registration fee fields' as status;
