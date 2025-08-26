-- 데이터베이스 스키마 개선사항
-- 성능 최적화를 위한 인덱스 추가 및 제약 조건 강화

-- 1. 성능 최적화를 위한 복합 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_expert_requests_status_category_created 
ON expert_requests(status, category, created_at DESC) 
WHERE status = 'open' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_expert_requests_budget_range 
ON expert_requests(budget_min, budget_max, status) 
WHERE status = 'open' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_expert_requests_deadline 
ON expert_requests(deadline, status) 
WHERE status = 'open' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_expert_request_proposals_request_status 
ON expert_request_proposals(request_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expert_request_proposals_expert_status 
ON expert_request_proposals(expert_id, status, created_at DESC);

-- 2. 데이터 무결성을 위한 제약 조건 추가
ALTER TABLE expert_requests 
ADD CONSTRAINT check_budget_range 
CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max);

ALTER TABLE expert_requests 
ADD CONSTRAINT check_budget_positive 
CHECK (budget_min IS NULL OR budget_min >= 10000);

ALTER TABLE expert_requests 
ADD CONSTRAINT check_budget_max_limit 
CHECK (budget_max IS NULL OR budget_max <= 100000000);

ALTER TABLE expert_requests 
ADD CONSTRAINT check_title_length 
CHECK (char_length(trim(title)) >= 10 AND char_length(trim(title)) <= 100);

ALTER TABLE expert_requests 
ADD CONSTRAINT check_description_length 
CHECK (char_length(trim(description)) >= 50 AND char_length(trim(description)) <= 2000);

ALTER TABLE expert_requests 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled'));

-- 3. 제안서 테이블 제약 조건
ALTER TABLE expert_request_proposals 
ADD CONSTRAINT check_proposed_budget_positive 
CHECK (proposed_budget IS NULL OR proposed_budget >= 10000);

ALTER TABLE expert_request_proposals 
ADD CONSTRAINT check_proposed_budget_max_limit 
CHECK (proposed_budget IS NULL OR proposed_budget <= 100000000);

ALTER TABLE expert_request_proposals 
ADD CONSTRAINT check_message_length 
CHECK (char_length(trim(message)) >= 50 AND char_length(trim(message)) <= 1000);

ALTER TABLE expert_request_proposals 
ADD CONSTRAINT check_timeline_length 
CHECK (proposed_timeline IS NULL OR char_length(trim(proposed_timeline)) <= 100);

ALTER TABLE expert_request_proposals 
ADD CONSTRAINT check_valid_proposal_status 
CHECK (status IN ('pending', 'accepted', 'rejected'));

-- 4. 유니크 제약 조건 - 한 사용자당 하나의 요청에 대해 하나의 제안만 가능
ALTER TABLE expert_request_proposals 
ADD CONSTRAINT unique_expert_request_proposal 
UNIQUE (expert_id, request_id);

-- 5. 외래 키 제약 조건 강화 (CASCADE 옵션 추가)
ALTER TABLE expert_request_proposals 
DROP CONSTRAINT IF EXISTS expert_request_proposals_request_id_fkey,
ADD CONSTRAINT expert_request_proposals_request_id_fkey 
FOREIGN KEY (request_id) REFERENCES expert_requests(id) ON DELETE CASCADE;

ALTER TABLE expert_request_proposals 
DROP CONSTRAINT IF EXISTS expert_request_proposals_expert_id_fkey,
ADD CONSTRAINT expert_request_proposals_expert_id_fkey 
FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE expert_requests 
DROP CONSTRAINT IF EXISTS expert_requests_requester_id_fkey,
ADD CONSTRAINT expert_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. 트리거 함수 - 자동으로 updated_at 필드 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_expert_requests_updated_at 
    BEFORE UPDATE ON expert_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expert_request_proposals_updated_at 
    BEFORE UPDATE ON expert_request_proposals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 비즈니스 로직 검증을 위한 트리거 함수
CREATE OR REPLACE FUNCTION validate_expert_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 완료된 요청이나 취소된 요청은 다른 상태로 변경 불가
    IF OLD.status IN ('completed', 'cancelled') AND NEW.status != OLD.status THEN
        RAISE EXCEPTION 'Cannot change status from % to %', OLD.status, NEW.status;
    END IF;
    
    -- open -> in_progress는 수락된 제안이 있을 때만 가능
    IF OLD.status = 'open' AND NEW.status = 'in_progress' THEN
        IF NOT EXISTS (
            SELECT 1 FROM expert_request_proposals 
            WHERE request_id = NEW.id AND status = 'accepted'
        ) THEN
            RAISE EXCEPTION 'Cannot change status to in_progress without accepted proposal';
        END IF;
    END IF;
    
    -- in_progress -> completed만 허용
    IF OLD.status = 'in_progress' AND NEW.status NOT IN ('in_progress', 'completed') THEN
        RAISE EXCEPTION 'Can only complete in_progress requests';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 상태 변경 검증 트리거
CREATE TRIGGER validate_expert_request_status_change_trigger
    BEFORE UPDATE OF status ON expert_requests
    FOR EACH ROW
    EXECUTE FUNCTION validate_expert_request_status_change();

-- 8. 제안서 상태 변경 검증 트리거
CREATE OR REPLACE FUNCTION validate_proposal_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 수락되거나 거절된 제안은 다시 pending으로 변경 불가
    IF OLD.status IN ('accepted', 'rejected') AND NEW.status = 'pending' THEN
        RAISE EXCEPTION 'Cannot change proposal status from % back to pending', OLD.status;
    END IF;
    
    -- 하나의 요청에 대해 하나의 제안만 수락 가능
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        IF EXISTS (
            SELECT 1 FROM expert_request_proposals 
            WHERE request_id = NEW.request_id 
            AND id != NEW.id 
            AND status = 'accepted'
        ) THEN
            RAISE EXCEPTION 'Another proposal is already accepted for this request';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 제안서 상태 변경 검증 트리거
CREATE TRIGGER validate_proposal_status_change_trigger
    BEFORE UPDATE OF status ON expert_request_proposals
    FOR EACH ROW
    EXECUTE FUNCTION validate_proposal_status_change();

-- 9. RLS 정책 개선 (더 세부적인 권한 제어)
-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS expert_requests_policy ON expert_requests;
DROP POLICY IF EXISTS expert_request_proposals_policy ON expert_request_proposals;

-- 전문가 요청 RLS 정책
CREATE POLICY expert_requests_select_policy ON expert_requests
    FOR SELECT USING (
        deleted_at IS NULL AND (
            status = 'open' OR 
            requester_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM expert_request_proposals 
                WHERE request_id = id AND expert_id = auth.uid()
            )
        )
    );

CREATE POLICY expert_requests_insert_policy ON expert_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY expert_requests_update_policy ON expert_requests
    FOR UPDATE USING (requester_id = auth.uid());

CREATE POLICY expert_requests_delete_policy ON expert_requests
    FOR DELETE USING (requester_id = auth.uid());

-- 제안서 RLS 정책
CREATE POLICY expert_request_proposals_select_policy ON expert_request_proposals
    FOR SELECT USING (
        expert_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM expert_requests 
            WHERE id = request_id AND requester_id = auth.uid()
        )
    );

CREATE POLICY expert_request_proposals_insert_policy ON expert_request_proposals
    FOR INSERT WITH CHECK (expert_id = auth.uid());

CREATE POLICY expert_request_proposals_update_policy ON expert_request_proposals
    FOR UPDATE USING (expert_id = auth.uid());

CREATE POLICY expert_request_proposals_delete_policy ON expert_request_proposals
    FOR DELETE USING (expert_id = auth.uid());

-- 10. 통계 및 모니터링을 위한 뷰 생성
CREATE OR REPLACE VIEW expert_requests_stats AS
SELECT 
    status,
    category,
    COUNT(*) as count,
    AVG(budget_min) as avg_min_budget,
    AVG(budget_max) as avg_max_budget,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_completion_days
FROM expert_requests
WHERE deleted_at IS NULL
GROUP BY status, category;

CREATE OR REPLACE VIEW proposal_stats AS
SELECT 
    er.category,
    COUNT(erp.*) as total_proposals,
    COUNT(CASE WHEN erp.status = 'accepted' THEN 1 END) as accepted_proposals,
    COUNT(CASE WHEN erp.status = 'rejected' THEN 1 END) as rejected_proposals,
    COUNT(CASE WHEN erp.status = 'pending' THEN 1 END) as pending_proposals,
    AVG(erp.proposed_budget) as avg_proposed_budget
FROM expert_requests er
LEFT JOIN expert_request_proposals erp ON er.id = erp.request_id
WHERE er.deleted_at IS NULL
GROUP BY er.category;