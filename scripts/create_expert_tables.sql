-- expert_requests 테이블 생성
CREATE TABLE IF NOT EXISTS expert_requests (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    description TEXT NOT NULL,
    budget_min INTEGER,
    budget_max INTEGER,
    deadline DATE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- expert_request_proposals 테이블 생성
CREATE TABLE IF NOT EXISTS expert_request_proposals (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES expert_requests(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    proposed_budget INTEGER,
    proposed_timeline TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, expert_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_expert_requests_requester_id ON expert_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_expert_requests_status ON expert_requests(status);
CREATE INDEX IF NOT EXISTS idx_expert_requests_category ON expert_requests(category);
CREATE INDEX IF NOT EXISTS idx_expert_requests_created_at ON expert_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expert_request_proposals_request_id ON expert_request_proposals(request_id);
CREATE INDEX IF NOT EXISTS idx_expert_request_proposals_expert_id ON expert_request_proposals(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_request_proposals_status ON expert_request_proposals(status);

-- RLS (Row Level Security) 활성화
ALTER TABLE expert_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_request_proposals ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 모든 사용자는 공개된 전문가 요청을 볼 수 있음
CREATE POLICY "Everyone can view expert requests" ON expert_requests FOR SELECT USING (true);

-- 인증된 사용자만 전문가 요청을 생성할 수 있음
CREATE POLICY "Authenticated users can insert expert requests" ON expert_requests 
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- 요청자만 자신의 요청을 수정할 수 있음
CREATE POLICY "Requesters can update their own requests" ON expert_requests 
    FOR UPDATE USING (auth.uid() = requester_id);

-- 요청자만 자신의 요청을 삭제할 수 있음
CREATE POLICY "Requesters can delete their own requests" ON expert_requests 
    FOR DELETE USING (auth.uid() = requester_id);

-- 모든 사용자는 제안을 볼 수 있음
CREATE POLICY "Everyone can view proposals" ON expert_request_proposals FOR SELECT USING (true);

-- 인증된 사용자만 제안을 생성할 수 있음
CREATE POLICY "Authenticated users can insert proposals" ON expert_request_proposals 
    FOR INSERT WITH CHECK (auth.uid() = expert_id);

-- 전문가는 자신의 제안을 수정할 수 있음
CREATE POLICY "Experts can update their own proposals" ON expert_request_proposals 
    FOR UPDATE USING (auth.uid() = expert_id);

-- 전문가는 자신의 제안을 삭제할 수 있음
CREATE POLICY "Experts can delete their own proposals" ON expert_request_proposals 
    FOR DELETE USING (auth.uid() = expert_id);