-- 서비스 리뷰 테이블 생성
CREATE TABLE IF NOT EXISTS service_reviews (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES service_orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 한 사용자가 한 서비스에 대해 하나의 리뷰만 작성 가능
    UNIQUE(service_id, reviewer_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_reviewer_id ON service_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_rating ON service_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_service_reviews_created_at ON service_reviews(created_at);

-- updated_at 자동 업데이트 트리거 생성
CREATE TRIGGER update_service_reviews_updated_at 
    BEFORE UPDATE ON service_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 서비스 평점 업데이트 함수
CREATE OR REPLACE FUNCTION update_service_rating(service_id_in BIGINT)
RETURNS VOID AS $$
DECLARE
    avg_rating NUMERIC;
    review_count INTEGER;
BEGIN
    -- 해당 서비스의 평균 평점과 리뷰 수 계산
    SELECT 
        ROUND(AVG(rating), 1),
        COUNT(*)
    INTO avg_rating, review_count
    FROM service_reviews 
    WHERE service_id = service_id_in;
    
    -- 리뷰가 없는 경우 기본값 설정
    IF review_count = 0 THEN
        avg_rating := 0;
        review_count := 0;
    END IF;
    
    -- services 테이블의 rating과 rating_count 업데이트
    UPDATE services 
    SET 
        rating = avg_rating,
        rating_count = review_count,
        updated_at = NOW()
    WHERE id = service_id_in;
    
    RAISE NOTICE '서비스 평점 업데이트 완료 - Service ID: %, 평균 평점: %, 리뷰 수: %', 
                 service_id_in, avg_rating, review_count;
    
END;
$$ LANGUAGE plpgsql;

-- 리뷰 삽입/업데이트/삭제 시 서비스 평점 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION trigger_update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT나 UPDATE의 경우
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_service_rating(NEW.service_id);
        RETURN NEW;
    END IF;
    
    -- DELETE의 경우
    IF TG_OP = 'DELETE' THEN
        PERFORM update_service_rating(OLD.service_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER service_reviews_rating_update_trigger
    AFTER INSERT OR UPDATE OR DELETE ON service_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_service_rating();

-- 서비스별 리뷰 통계 뷰
CREATE OR REPLACE VIEW service_review_stats AS
SELECT 
    s.id as service_id,
    s.title as service_title,
    s.rating,
    s.rating_count,
    COUNT(CASE WHEN sr.rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN sr.rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN sr.rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN sr.rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN sr.rating = 1 THEN 1 END) as one_star_count
FROM services s
LEFT JOIN service_reviews sr ON s.id = sr.service_id
GROUP BY s.id, s.title, s.rating, s.rating_count;

-- RLS (Row Level Security) 설정
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 리뷰를 조회할 수 있음
CREATE POLICY service_reviews_select_policy ON service_reviews
    FOR SELECT 
    USING (true);

-- 로그인한 사용자만 리뷰 작성 가능
CREATE POLICY service_reviews_insert_policy ON service_reviews
    FOR INSERT 
    WITH CHECK (auth.uid() = reviewer_id);

-- 리뷰 작성자만 자신의 리뷰를 수정/삭제 가능
CREATE POLICY service_reviews_update_policy ON service_reviews
    FOR UPDATE 
    USING (auth.uid() = reviewer_id);

CREATE POLICY service_reviews_delete_policy ON service_reviews
    FOR DELETE 
    USING (auth.uid() = reviewer_id);

-- 관리자는 모든 리뷰에 접근 가능
CREATE POLICY service_reviews_admin_policy ON service_reviews
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION update_service_rating(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_service_rating() TO authenticated;

-- 테이블 권한 설정
GRANT SELECT, INSERT, UPDATE, DELETE ON service_reviews TO authenticated;
GRANT SELECT ON service_review_stats TO authenticated;

-- 시퀀스 권한 설정
GRANT USAGE, SELECT ON SEQUENCE service_reviews_id_seq TO authenticated;

-- services 테이블에 rating과 rating_count 컬럼이 없다면 추가
-- (이미 있다면 이 부분은 에러가 날 수 있으므로 주석 처리)
/*
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
*/

-- 샘플 데이터 (테스트용 - 실제 운영시에는 제거)
/*
INSERT INTO service_reviews (service_id, reviewer_id, rating, title, content) 
VALUES 
(1, 'reviewer-uuid-1', 5, '정말 만족스러운 서비스!', '빠르고 정확한 작업이었습니다. 추천해요!'),
(1, 'reviewer-uuid-2', 4, '좋은 서비스', '전반적으로 만족합니다.'),
(2, 'reviewer-uuid-1', 3, '보통', '그냥 그래요.');
*/ 