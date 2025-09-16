-- expert_request_proposals 테이블에서 사용하지 않는 컬럼들 제거

BEGIN;

-- 1. 기존 데이터 백업을 위한 임시 테이블 생성 (필요시 롤백용)
CREATE TABLE IF NOT EXISTS expert_request_proposals_backup AS 
SELECT * FROM expert_request_proposals;

-- 2. proposed_budget 컬럼 제거
ALTER TABLE expert_request_proposals 
DROP COLUMN IF EXISTS proposed_budget;

-- 3. proposed_timeline 컬럼 제거  
ALTER TABLE expert_request_proposals 
DROP COLUMN IF EXISTS proposed_timeline;

-- 4. 사용하지 않는 인덱스가 있다면 제거 (성능 최적화)
-- 제거된 컬럼과 관련된 인덱스는 자동으로 제거되므로 별도 작업 불필요

-- 5. 테이블 통계 업데이트
ANALYZE expert_request_proposals;

-- 6. 변경사항 확인을 위한 테이블 구조 출력
\d expert_request_proposals;

COMMIT;

-- 백업 테이블 제거 (필요시 주석 해제)
-- DROP TABLE IF EXISTS expert_request_proposals_backup;