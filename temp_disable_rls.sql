-- 임시로 RLS 비활성화 (디버깅용)
ALTER TABLE moon_charges DISABLE ROW LEVEL SECURITY;

-- 테스트 후 다시 활성화하려면:
-- ALTER TABLE moon_charges ENABLE ROW LEVEL SECURITY; 