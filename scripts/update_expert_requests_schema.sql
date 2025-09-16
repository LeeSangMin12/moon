-- expert_requests 테이블 스키마 업데이트
-- 기존 필드를 새로운 필드로 변경

BEGIN;

-- 새로운 컬럼들 추가
ALTER TABLE expert_requests 
ADD COLUMN IF NOT EXISTS reward_amount INTEGER,
ADD COLUMN IF NOT EXISTS application_deadline DATE,
ADD COLUMN IF NOT EXISTS work_start_date DATE,
ADD COLUMN IF NOT EXISTS work_end_date DATE,
ADD COLUMN IF NOT EXISTS max_applicants INTEGER,
ADD COLUMN IF NOT EXISTS work_location TEXT;

-- 기존 budget_min, budget_max 데이터가 있다면 reward_amount로 이동
-- (budget_max가 있으면 budget_max를, 없으면 budget_min을 사용)
UPDATE expert_requests 
SET reward_amount = COALESCE(budget_max, budget_min)
WHERE reward_amount IS NULL AND (budget_min IS NOT NULL OR budget_max IS NOT NULL);

-- 기존 deadline을 application_deadline으로 이동
UPDATE expert_requests 
SET application_deadline = deadline
WHERE application_deadline IS NULL AND deadline IS NOT NULL;

-- 기본값 설정
UPDATE expert_requests 
SET max_applicants = 1
WHERE max_applicants IS NULL;

UPDATE expert_requests 
SET work_location = '협의 후 결정'
WHERE work_location IS NULL OR work_location = '';

-- 기존 컬럼들 제거 (데이터 이동 후)
ALTER TABLE expert_requests 
DROP COLUMN IF EXISTS budget_min,
DROP COLUMN IF EXISTS budget_max,
DROP COLUMN IF EXISTS deadline;

-- NOT NULL 제약 조건 추가
ALTER TABLE expert_requests 
ALTER COLUMN reward_amount SET NOT NULL,
ALTER COLUMN max_applicants SET NOT NULL,
ALTER COLUMN work_location SET NOT NULL;

-- 체크 제약 조건 추가
ALTER TABLE expert_requests 
ADD CONSTRAINT chk_reward_amount CHECK (reward_amount >= 10000 AND reward_amount <= 100000000),
ADD CONSTRAINT chk_max_applicants CHECK (max_applicants >= 1 AND max_applicants <= 100),
ADD CONSTRAINT chk_work_location_length CHECK (LENGTH(TRIM(work_location)) >= 2 AND LENGTH(TRIM(work_location)) <= 100);

-- 날짜 체크 제약 조건 추가
ALTER TABLE expert_requests 
ADD CONSTRAINT chk_application_deadline CHECK (application_deadline IS NULL OR application_deadline >= CURRENT_DATE),
ADD CONSTRAINT chk_work_dates CHECK (work_start_date IS NULL OR work_end_date IS NULL OR work_end_date >= work_start_date);

-- 새로운 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_expert_requests_reward_amount ON expert_requests(reward_amount);
CREATE INDEX IF NOT EXISTS idx_expert_requests_application_deadline ON expert_requests(application_deadline);
CREATE INDEX IF NOT EXISTS idx_expert_requests_work_location ON expert_requests(work_location);
CREATE INDEX IF NOT EXISTS idx_expert_requests_work_start_date ON expert_requests(work_start_date);

COMMIT;