-- users 테이블에 email 컬럼 추가

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN users.email IS '사용자 이메일 주소';

-- 완료
SELECT 'Email column added to users table!' as status;
