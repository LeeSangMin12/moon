-- users 테이블에 role 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- 기존 사용자들에게 기본 role 설정
UPDATE users 
SET role = 'user' 
WHERE role IS NULL;

-- 관리자 계정 생성/업데이트 (실제 사용자 ID로 교체 필요)
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE id = 'your-admin-user-id-here';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- RLS 정책 업데이트 (관리자 권한 반영)
-- 기존 moon_charges 정책 삭제 후 재생성
DROP POLICY IF EXISTS moon_charges_admin_policy ON moon_charges;

-- 관리자는 모든 충전 요청을 볼 수 있도록 정책 재생성
CREATE POLICY moon_charges_admin_policy ON moon_charges
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 샘플 관리자 계정 생성 쿼리 (필요시 사용)
-- 실제 운영시에는 보안을 위해 다른 방법으로 관리자 계정을 설정하세요
/*
-- 예시: 특정 사용자를 관리자로 설정
UPDATE users 
SET role = 'admin' 
WHERE handle = 'admin_handle_here';

-- 또는 이메일로 찾아서 설정
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"admin"'
) 
WHERE email = 'admin@example.com';
*/ 