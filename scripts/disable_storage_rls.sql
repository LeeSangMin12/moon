-- proposals 버킷의 RLS 비활성화
-- Supabase 대시보드에서 실행하거나, 대시보드 Storage 설정에서 "Enable RLS" 체크 해제

-- 방법 1: SQL로 비활성화 (Supabase가 막을 수 있음)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 방법 2: 대시보드 사용 (권장)
-- 1. Supabase 대시보드 접속
-- 2. Storage > proposals 버킷 선택
-- 3. "Policies" 탭
-- 4. "Disable RLS" 또는 모든 정책 삭제

-- 방법 3: 모든 접근 허용하는 정책 추가
DROP POLICY IF EXISTS "Allow all operations on proposals bucket" ON storage.objects;

CREATE POLICY "Allow all operations on proposals bucket"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'proposals')
WITH CHECK (bucket_id = 'proposals');
