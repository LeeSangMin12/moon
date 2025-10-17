-- expert_request_orders 테이블 생성
-- 전문가 요청의 결제/주문 관리를 위한 테이블

CREATE TABLE IF NOT EXISTS expert_request_orders (
  id BIGSERIAL PRIMARY KEY,

  -- 관계 참조
  request_id BIGINT NOT NULL REFERENCES expert_requests(id) ON DELETE CASCADE,
  proposal_id BIGINT NOT NULL REFERENCES expert_request_proposals(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 요청 정보 (비정규화 - 빠른 조회용)
  request_title VARCHAR(500) NOT NULL,

  -- 금액 정보
  amount INTEGER NOT NULL, -- 전문가가 제안한 금액 (proposed_amount)
  commission_amount BIGINT, -- 플랫폼 수수료 (5%)
  total_with_commission INTEGER NOT NULL, -- 의뢰인이 지불하는 총 금액

  -- 입금 정보
  depositor_name VARCHAR(100) NOT NULL, -- 입금자명
  bank VARCHAR(100) NOT NULL, -- 은행
  account_number VARCHAR(100) NOT NULL, -- 계좌번호
  requester_contact VARCHAR(200), -- 의뢰인 연락처

  -- 상태 관리
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, completed, cancelled, refunded

  -- 추가 정보
  special_request TEXT, -- 의뢰인 특별 요청사항
  reject_reason TEXT, -- 거절 사유
  admin_memo TEXT, -- 관리자 메모

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ, -- 결제 승인 시간
  completed_at TIMESTAMPTZ, -- 완료 시간

  -- 제약 조건
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'completed', 'cancelled', 'refunded')),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_total CHECK (total_with_commission > 0)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_expert_request_orders_request_id ON expert_request_orders(request_id);
CREATE INDEX IF NOT EXISTS idx_expert_request_orders_proposal_id ON expert_request_orders(proposal_id);
CREATE INDEX IF NOT EXISTS idx_expert_request_orders_requester_id ON expert_request_orders(requester_id);
CREATE INDEX IF NOT EXISTS idx_expert_request_orders_expert_id ON expert_request_orders(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_request_orders_status ON expert_request_orders(status);
CREATE INDEX IF NOT EXISTS idx_expert_request_orders_created_at ON expert_request_orders(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_expert_request_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expert_request_orders_updated_at
  BEFORE UPDATE ON expert_request_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_request_orders_updated_at();

-- RLS (Row Level Security) 활성화
ALTER TABLE expert_request_orders ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 의뢰인과 전문가만 자신의 주문 조회 가능
CREATE POLICY "Users can view their own orders"
  ON expert_request_orders
  FOR SELECT
  USING (
    auth.uid() = requester_id
    OR auth.uid() = expert_id
  );

-- RLS 정책: 의뢰인만 주문 생성 가능
CREATE POLICY "Requesters can create orders"
  ON expert_request_orders
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- RLS 정책: 전문가만 자신의 주문 상태 업데이트 가능 (입금 승인)
CREATE POLICY "Experts can update their orders"
  ON expert_request_orders
  FOR UPDATE
  USING (auth.uid() = expert_id);

-- RLS 정책: 의뢰인도 자신의 주문 업데이트 가능 (취소 등)
CREATE POLICY "Requesters can update their orders"
  ON expert_request_orders
  FOR UPDATE
  USING (auth.uid() = requester_id);

-- 코멘트 추가
COMMENT ON TABLE expert_request_orders IS '전문가 요청 주문/결제 관리 테이블';
COMMENT ON COLUMN expert_request_orders.amount IS '전문가가 제안한 금액';
COMMENT ON COLUMN expert_request_orders.commission_amount IS '플랫폼 수수료 (5%, 전문가 부담)';
COMMENT ON COLUMN expert_request_orders.total_with_commission IS '의뢰인이 지불하는 총 금액';
COMMENT ON COLUMN expert_request_orders.status IS 'pending: 입금대기, paid: 입금완료, completed: 서비스완료, cancelled: 취소, refunded: 환불';

-- 완료
SELECT 'expert_request_orders table created successfully!' as status;
