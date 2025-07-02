-- 선택사항: services 테이블에 updated_at 컬럼 추가
-- 이 방법을 사용하려면 위의 fix_services_rating_function.sql 대신 이 파일을 실행하세요

-- 1. services 테이블에 updated_at 컬럼 추가
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. 기존 레코드들의 updated_at을 created_at과 같은 값으로 설정
UPDATE services 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. updated_at 자동 업데이트 트리거 생성
CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 이제 원래 함수를 그대로 사용할 수 있습니다 (updated_at 포함) 