-- 서비스 주문 테이블 생성
CREATE TABLE IF NOT EXISTS service_orders (
    id BIGSERIAL PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    service_title VARCHAR(255) NOT NULL, -- 주문 시점의 서비스 제목 (히스토리 보존)
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price > 0),
    total_amount INTEGER NOT NULL CHECK (total_amount > 0),
    
    -- 결제 정보
    depositor_name VARCHAR(50) NOT NULL, -- 입금자명
    bank VARCHAR(50) NOT NULL, -- 은행
    account_number VARCHAR(50) NOT NULL, -- 계좌번호
    
    -- 주문 상태
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled', 'refunded')),
    
    -- 추가 정보
    special_request TEXT, -- 특별 요청사항
    reject_reason TEXT, -- 취소/환불 사유
    admin_memo TEXT, -- 관리자 메모
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ, -- 결제 승인 시간
    completed_at TIMESTAMPTZ -- 서비스 완료 시간
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_service_orders_buyer_id ON service_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_seller_id ON service_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_service_id ON service_orders(service_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at);

-- updated_at 자동 업데이트 트리거 생성 (함수는 moon_charges에서 이미 생성됨)
CREATE TRIGGER update_service_orders_updated_at 
    BEFORE UPDATE ON service_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 주문 승인 함수 (결제 확인)
CREATE OR REPLACE FUNCTION approve_service_order(order_id_in BIGINT)
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- 주문 정보 조회
    SELECT buyer_id, seller_id, service_id, total_amount, status 
    INTO order_record 
    FROM service_orders 
    WHERE id = order_id_in;
    
    -- 주문이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '주문을 찾을 수 없습니다. ID: %', order_id_in;
    END IF;
    
    -- 이미 처리된 주문인 경우
    IF order_record.status != 'pending' THEN
        RAISE EXCEPTION '이미 처리된 주문입니다. 현재 상태: %', order_record.status;
    END IF;
    
    -- 주문 상태를 'paid'로 변경
    UPDATE service_orders 
    SET status = 'paid', 
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = order_id_in;
    
    -- 성공 로그
    RAISE NOTICE '서비스 주문 승인 완료 - 주문 ID: %, 구매자: %, 판매자: %', 
                 order_id_in, order_record.buyer_id, order_record.seller_id;
    
END;
$$ LANGUAGE plpgsql;

-- 주문 완료 함수 (서비스 제공 완료)
CREATE OR REPLACE FUNCTION complete_service_order(order_id_in BIGINT)
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- 주문 정보 조회
    SELECT status 
    INTO order_record 
    FROM service_orders 
    WHERE id = order_id_in;
    
    -- 주문이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '주문을 찾을 수 없습니다. ID: %', order_id_in;
    END IF;
    
    -- 결제가 승인되지 않은 주문인 경우
    IF order_record.status != 'paid' THEN
        RAISE EXCEPTION '결제가 승인되지 않은 주문입니다. 현재 상태: %', order_record.status;
    END IF;
    
    -- 주문 상태를 'completed'로 변경
    UPDATE service_orders 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = order_id_in;
    
    RAISE NOTICE '서비스 주문 완료 - 주문 ID: %', order_id_in;
    
END;
$$ LANGUAGE plpgsql;

-- 주문 취소 함수
CREATE OR REPLACE FUNCTION cancel_service_order(order_id_in BIGINT, reason_in TEXT DEFAULT '')
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- 주문 정보 조회
    SELECT status 
    INTO order_record 
    FROM service_orders 
    WHERE id = order_id_in;
    
    -- 주문이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '주문을 찾을 수 없습니다. ID: %', order_id_in;
    END IF;
    
    -- 이미 완료된 주문인 경우
    IF order_record.status = 'completed' THEN
        RAISE EXCEPTION '이미 완료된 주문은 취소할 수 없습니다. 현재 상태: %', order_record.status;
    END IF;
    
    -- 주문 취소 처리
    UPDATE service_orders 
    SET status = 'cancelled',
        reject_reason = reason_in,
        updated_at = NOW()
    WHERE id = order_id_in;
    
    RAISE NOTICE '서비스 주문 취소 완료 - 주문 ID: %, 취소 사유: %', order_id_in, reason_in;
    
END;
$$ LANGUAGE plpgsql;

-- 주문 환불 함수
CREATE OR REPLACE FUNCTION refund_service_order(order_id_in BIGINT, reason_in TEXT DEFAULT '')
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- 주문 정보 조회
    SELECT status 
    INTO order_record 
    FROM service_orders 
    WHERE id = order_id_in;
    
    -- 주문이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '주문을 찾을 수 없습니다. ID: %', order_id_in;
    END IF;
    
    -- 결제되지 않은 주문인 경우
    IF order_record.status NOT IN ('paid', 'completed') THEN
        RAISE EXCEPTION '결제되지 않은 주문은 환불할 수 없습니다. 현재 상태: %', order_record.status;
    END IF;
    
    -- 주문 환불 처리
    UPDATE service_orders 
    SET status = 'refunded',
        reject_reason = reason_in,
        updated_at = NOW()
    WHERE id = order_id_in;
    
    RAISE NOTICE '서비스 주문 환불 완료 - 주문 ID: %, 환불 사유: %', order_id_in, reason_in;
    
END;
$$ LANGUAGE plpgsql;

-- 주문 통계 뷰
CREATE OR REPLACE VIEW service_order_stats AS
SELECT 
    u.id as user_id,
    u.handle,
    u.name,
    -- 구매자로서의 통계
    COALESCE(SUM(CASE WHEN so_buyer.status = 'completed' THEN so_buyer.total_amount ELSE 0 END), 0) as total_purchased_amount,
    COUNT(CASE WHEN so_buyer.status = 'pending' THEN 1 END) as pending_purchases,
    COUNT(CASE WHEN so_buyer.status = 'completed' THEN 1 END) as completed_purchases,
    -- 판매자로서의 통계
    COALESCE(SUM(CASE WHEN so_seller.status = 'completed' THEN so_seller.total_amount ELSE 0 END), 0) as total_sales_amount,
    COUNT(CASE WHEN so_seller.status = 'pending' THEN 1 END) as pending_sales,
    COUNT(CASE WHEN so_seller.status = 'completed' THEN 1 END) as completed_sales
FROM users u
LEFT JOIN service_orders so_buyer ON u.id = so_buyer.buyer_id
LEFT JOIN service_orders so_seller ON u.id = so_seller.seller_id
GROUP BY u.id, u.handle, u.name;

-- RLS (Row Level Security) 설정
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- 구매자와 판매자는 자신과 관련된 주문만 볼 수 있음
CREATE POLICY service_orders_user_policy ON service_orders
    FOR SELECT 
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 구매자만 주문 생성 가능
CREATE POLICY service_orders_insert_policy ON service_orders
    FOR INSERT 
    WITH CHECK (auth.uid() = buyer_id);

-- 구매자와 판매자는 자신과 관련된 주문만 업데이트 가능 (특정 필드만)
CREATE POLICY service_orders_update_policy ON service_orders
    FOR UPDATE 
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 관리자는 모든 주문을 볼 수 있도록 정책 추가
CREATE POLICY service_orders_admin_policy ON service_orders
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION approve_service_order(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_service_order(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_service_order(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION refund_service_order(BIGINT, TEXT) TO authenticated;

-- 테이블 권한 설정
GRANT SELECT, INSERT, UPDATE ON service_orders TO authenticated;
GRANT SELECT ON service_order_stats TO authenticated;

-- 시퀀스 권한 설정
GRANT USAGE, SELECT ON SEQUENCE service_orders_id_seq TO authenticated;

-- 샘플 데이터 (테스트용 - 실제 운영시에는 제거)
/*
INSERT INTO service_orders (
    buyer_id, seller_id, service_id, service_title, 
    quantity, unit_price, total_amount,
    depositor_name, bank, account_number
) VALUES 
(
    'buyer-uuid', 'seller-uuid', 1, '웹 개발 서비스',
    1, 150000, 150000,
    '김구매자', '국민은행', '123-456-789'
);
*/ 