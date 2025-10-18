-- 쿠폰 시스템 테이블 생성

-- 1. coupons 테이블 (쿠폰 마스터)
CREATE TABLE IF NOT EXISTS coupons (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,        -- 쿠폰 코드 (예: WELCOME2024)
  name TEXT NOT NULL,                      -- 쿠폰 이름
  description TEXT,                        -- 설명
  coupon_type VARCHAR(50) NOT NULL,        -- 'service_purchase', 'job_registration', 'all'
  discount_type VARCHAR(20) NOT NULL,      -- 'fixed' (정액), 'percentage' (정률)
  discount_value INTEGER NOT NULL,         -- 할인액 또는 할인율
  max_discount_amount INTEGER,             -- 최대 할인 금액 (정률일 때)
  min_purchase_amount INTEGER DEFAULT 0,   -- 최소 주문 금액
  valid_from TIMESTAMPTZ,                  -- 유효 시작일
  valid_until TIMESTAMPTZ,                 -- 유효 종료일
  max_usage_count INTEGER,                 -- 전체 사용 가능 횟수 (NULL=무제한)
  current_usage_count INTEGER DEFAULT 0,   -- 현재 사용 횟수
  max_usage_per_user INTEGER DEFAULT 1,    -- 사용자당 사용 횟수
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. user_coupons 테이블 (사용자별 쿠폰 사용 이력)
CREATE TABLE IF NOT EXISTS user_coupons (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  coupon_id BIGINT REFERENCES coupons(id) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),       -- 사용 시각
  order_id BIGINT REFERENCES service_orders(id),
  expert_request_id BIGINT REFERENCES expert_requests(id),
  discount_amount INTEGER NOT NULL,        -- 실제 할인 금액
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON coupons(coupon_type);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON user_coupons(coupon_id);

-- 3. 기존 테이블 수정 - service_orders
ALTER TABLE service_orders
ADD COLUMN IF NOT EXISTS coupon_id BIGINT REFERENCES coupons(id),
ADD COLUMN IF NOT EXISTS coupon_discount INTEGER DEFAULT 0;

-- 4. 기존 테이블 수정 - expert_requests
ALTER TABLE expert_requests
ADD COLUMN IF NOT EXISTS coupon_id BIGINT REFERENCES coupons(id),
ADD COLUMN IF NOT EXISTS coupon_discount INTEGER DEFAULT 0;

-- 5. RPC 함수: 쿠폰 사용 횟수 증가 (동시성 안전)
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id_param BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET current_usage_count = current_usage_count + 1,
      updated_at = NOW()
  WHERE id = coupon_id_param;
END;
$$;

-- 6. 초기 쿠폰 데이터 생성
-- 서비스 구매 5,000원 할인 쿠폰
INSERT INTO coupons (
  code,
  name,
  description,
  coupon_type,
  discount_type,
  discount_value,
  min_purchase_amount,
  valid_from,
  valid_until,
  max_usage_per_user,
  is_active
) VALUES (
  'WELCOME5000',
  '신규 가입 환영 쿠폰',
  '서비스 구매 시 5,000원 할인',
  'service_purchase',
  'fixed',
  5000,
  10000,  -- 최소 10,000원 이상 구매 시
  NOW(),
  NOW() + INTERVAL '1 year',
  1,
  true
);

-- 사이드/풀타임 잡 등록 무료 쿠폰 (4,900원)
INSERT INTO coupons (
  code,
  name,
  description,
  coupon_type,
  discount_type,
  discount_value,
  min_purchase_amount,
  valid_from,
  valid_until,
  max_usage_per_user,
  is_active
) VALUES (
  'JOBFREE',
  '잡 등록 무료 쿠폰',
  '사이드잡/풀타임 잡 등록비 무료',
  'job_registration',
  'fixed',
  4900,
  0,
  NOW(),
  NOW() + INTERVAL '1 year',
  1,
  true
);

-- 완료
SELECT 'Coupon system created successfully!' as status;
