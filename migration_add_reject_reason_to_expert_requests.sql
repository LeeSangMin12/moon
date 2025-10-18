-- Add reject_reason column to expert_requests table
ALTER TABLE expert_requests
ADD COLUMN IF NOT EXISTS reject_reason TEXT;

COMMENT ON COLUMN expert_requests.reject_reason IS '관리자가 공고를 거절한 경우 사유';
