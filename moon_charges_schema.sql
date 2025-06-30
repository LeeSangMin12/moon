-- 문 충전 요청 테이블 생성
CREATE TABLE IF NOT EXISTS moon_charges (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    point INTEGER NOT NULL CHECK (point > 0),
    amount INTEGER NOT NULL CHECK (amount > 0),
    bank VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_moon_charges_user_id ON moon_charges(user_id);
CREATE INDEX IF NOT EXISTS idx_moon_charges_status ON moon_charges(status);
CREATE INDEX IF NOT EXISTS idx_moon_charges_created_at ON moon_charges(created_at);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_moon_charges_updated_at 
    BEFORE UPDATE ON moon_charges 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 문 충전 승인 함수
CREATE OR REPLACE FUNCTION approve_moon_charge(charge_id_in BIGINT)
RETURNS VOID AS $$
DECLARE
    charge_record RECORD;
    current_user_id UUID;
    charge_point INTEGER;
BEGIN
    -- 충전 요청 정보 조회
    SELECT user_id, point, status 
    INTO charge_record 
    FROM moon_charges 
    WHERE id = charge_id_in;
    
    -- 충전 요청이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '충전 요청을 찾을 수 없습니다. ID: %', charge_id_in;
    END IF;
    
    -- 이미 처리된 요청인 경우
    IF charge_record.status != 'pending' THEN
        RAISE EXCEPTION '이미 처리된 충전 요청입니다. 현재 상태: %', charge_record.status;
    END IF;
    
    current_user_id := charge_record.user_id;
    charge_point := charge_record.point;
    
    -- 트랜잭션 시작 (이미 함수 내부에서 자동으로 트랜잭션 처리됨)
    
    -- 1. 충전 요청 상태를 'approved'로 변경
    UPDATE moon_charges 
    SET status = 'approved', 
        updated_at = NOW()
    WHERE id = charge_id_in;
    
    -- 2. 사용자의 moon_point 증가
    UPDATE users 
    SET moon_point = COALESCE(moon_point, 0) + charge_point
    WHERE id = current_user_id;
    
    -- 사용자가 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다. User ID: %', current_user_id;
    END IF;
    
    -- 성공 로그 (선택사항)
    RAISE NOTICE '문 충전 승인 완료 - User ID: %, 충전량: %, 요청 ID: %', current_user_id, charge_point, charge_id_in;
    
END;
$$ LANGUAGE plpgsql;

-- 문 충전 거절 함수
CREATE OR REPLACE FUNCTION reject_moon_charge(charge_id_in BIGINT, reason_in TEXT DEFAULT '')
RETURNS VOID AS $$
DECLARE
    charge_record RECORD;
BEGIN
    -- 충전 요청 정보 조회
    SELECT status 
    INTO charge_record 
    FROM moon_charges 
    WHERE id = charge_id_in;
    
    -- 충전 요청이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '충전 요청을 찾을 수 없습니다. ID: %', charge_id_in;
    END IF;
    
    -- 이미 처리된 요청인 경우
    IF charge_record.status != 'pending' THEN
        RAISE EXCEPTION '이미 처리된 충전 요청입니다. 현재 상태: %', charge_record.status;
    END IF;
    
    -- 충전 요청 거절 처리
    UPDATE moon_charges 
    SET status = 'rejected',
        reject_reason = reason_in,
        updated_at = NOW()
    WHERE id = charge_id_in;
    
    RAISE NOTICE '문 충전 거절 완료 - 요청 ID: %, 거절 사유: %', charge_id_in, reason_in;
    
END;
$$ LANGUAGE plpgsql;

-- 사용자별 충전 통계 뷰 (선택사항)
CREATE OR REPLACE VIEW user_charge_stats AS
SELECT 
    u.id as user_id,
    u.handle,
    u.name,
    COALESCE(SUM(CASE WHEN mc.status = 'approved' THEN mc.point ELSE 0 END), 0) as total_charged_points,
    COALESCE(SUM(CASE WHEN mc.status = 'approved' THEN mc.amount ELSE 0 END), 0) as total_charged_amount,
    COUNT(CASE WHEN mc.status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN mc.status = 'approved' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN mc.status = 'rejected' THEN 1 END) as rejected_requests
FROM users u
LEFT JOIN moon_charges mc ON u.id = mc.user_id
GROUP BY u.id, u.handle, u.name;

-- RLS (Row Level Security) 설정 (선택사항)
-- 사용자는 자신의 충전 요청만 볼 수 있도록 제한
ALTER TABLE moon_charges ENABLE ROW LEVEL SECURITY;

-- 사용자 본인의 충전 요청만 조회 가능
CREATE POLICY moon_charges_user_policy ON moon_charges
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 사용자 본인만 충전 요청 생성 가능
CREATE POLICY moon_charges_insert_policy ON moon_charges
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 충전 요청을 볼 수 있도록 정책 추가
-- (관리자 role이 있다고 가정)
CREATE POLICY moon_charges_admin_policy ON moon_charges
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (role = 'admin' OR role = 'super_admin')
        )
    );

-- 샘플 데이터 (테스트용 - 실제 운영시에는 제거)
-- INSERT INTO moon_charges (user_id, point, amount, bank, account_number, account_holder) 
-- VALUES 
-- ('sample-uuid', 100, 11000, '국민은행', '123-456-789', '홍길동'),
-- ('sample-uuid', 50, 5500, '신한은행', '987-654-321', '김철수');

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION approve_moon_charge(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_moon_charge(BIGINT, TEXT) TO authenticated;

-- 테이블 권한 설정
GRANT SELECT, INSERT ON moon_charges TO authenticated;
GRANT SELECT ON user_charge_stats TO authenticated; 