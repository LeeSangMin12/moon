-- 서비스 평점 업데이트 함수 수정 (updated_at 제거)
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
    
    -- services 테이블의 rating과 rating_count만 업데이트 (updated_at 제거)
    UPDATE services 
    SET 
        rating = avg_rating,
        rating_count = review_count
    WHERE id = service_id_in;
    
    RAISE NOTICE '서비스 평점 업데이트 완료 - Service ID: %, 평균 평점: %, 리뷰 수: %', 
                 service_id_in, avg_rating, review_count;
    
END;
$$ LANGUAGE plpgsql; 