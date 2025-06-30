-- users 테이블에 moon_point 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS moon_point INTEGER DEFAULT 0 CHECK (moon_point >= 0);

-- 기존 사용자들의 moon_point를 0으로 초기화
UPDATE users 
SET moon_point = 0 
WHERE moon_point IS NULL;

-- moon_point 컬럼을 NOT NULL로 변경
ALTER TABLE users 
ALTER COLUMN moon_point SET NOT NULL;

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_moon_point ON users(moon_point); 