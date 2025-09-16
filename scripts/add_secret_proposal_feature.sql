-- expert_request_proposals 테이블에 비밀제안 기능 추가

BEGIN;

-- is_secret 컬럼 추가 (기본값: false)
ALTER TABLE expert_request_proposals 
ADD COLUMN IF NOT EXISTS is_secret BOOLEAN NOT NULL DEFAULT false;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_expert_request_proposals_is_secret 
ON expert_request_proposals(is_secret);

-- 비밀제안 관련 코멘트 추가
COMMENT ON COLUMN expert_request_proposals.is_secret IS '비밀제안 여부 - true면 의뢰인만 제안 내용을 볼 수 있음';

COMMIT;