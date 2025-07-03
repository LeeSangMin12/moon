-- service_orders 테이블에 구매자 연락처 필드 추가
ALTER TABLE service_orders 
ADD COLUMN buyer_contact VARCHAR(50);

-- 기존 데이터에 대한 코멘트 추가
COMMENT ON COLUMN service_orders.buyer_contact IS '구매자 연락처 (전화번호, 이메일 등)'; 