-- 전문가 요청 수수료 컬럼 추가 마이그레이션
-- 기존 check constraint 문제 해결

-- 1. 기존 체크 제약 완전히 제거
ALTER TABLE expert_requests
DROP CONSTRAINT IF EXISTS chk_application_deadline;

-- 2. 컬럼 추가
ALTER TABLE expert_requests
ADD COLUMN IF NOT EXISTS commission_amount BIGINT,
ADD COLUMN IF NOT EXISTS total_with_commission INTEGER;

-- 3. 기존 데이터 업데이트
UPDATE expert_requests
SET
  total_with_commission = reward_amount,
  commission_amount = FLOOR(reward_amount * 0.05)
WHERE total_with_commission IS NULL;

-- 4. 새로운 제약 조건 추가 (NOT VALID 옵션으로 기존 데이터는 검증 안 함)
ALTER TABLE expert_requests
ADD CONSTRAINT chk_application_deadline
CHECK (
  application_deadline IS NULL
  OR application_deadline >= CURRENT_DATE
  OR status IN ('in_progress', 'completed', 'cancelled')
) NOT VALID;

-- 5. 향후 새로운 데이터에 대해서만 제약 조건 검증 활성화
-- (NOT VALID로 추가했으므로 기존 데이터는 영향 없음)

-- 6. 코멘트 추가
COMMENT ON COLUMN expert_requests.commission_amount IS '플랫폼 수수료 (5%, 전문가 부담)';
COMMENT ON COLUMN expert_requests.total_with_commission IS '요청자가 지불하는 총 금액 (보상금)';

-- 완료
SELECT 'Migration completed successfully!' as status;
