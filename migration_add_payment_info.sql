-- 입금 정보를 저장할 JSON 컬럼 추가

ALTER TABLE expert_requests
ADD COLUMN IF NOT EXISTS payment_info JSONB;

COMMENT ON COLUMN expert_requests.payment_info IS '입금 정보 (depositor_name, bank, account_number 등)';

-- 완료
SELECT 'Payment info column added!' as status;
