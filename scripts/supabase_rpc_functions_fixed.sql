-- 제안 수락 함수 (하나의 제안만 수락하고 나머지는 거절, 요청 상태를 진행중으로 변경)
-- 알림 기능 제거 버전
CREATE OR REPLACE FUNCTION accept_proposal(proposal_id_param BIGINT, request_id_param BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 권한 확인: 요청자만 제안을 수락할 수 있음
  IF NOT EXISTS (
    SELECT 1 FROM expert_requests 
    WHERE id = request_id_param 
    AND requester_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the requester can accept proposals';
  END IF;

  -- 요청이 아직 열린 상태인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM expert_requests 
    WHERE id = request_id_param 
    AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Request is not open for proposals';
  END IF;

  -- 해당 제안이 존재하고 pending 상태인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM expert_request_proposals 
    WHERE id = proposal_id_param 
    AND request_id = request_id_param 
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Proposal does not exist or is not pending';
  END IF;

  -- 트랜잭션 시작
  BEGIN
    -- 선택된 제안을 수락
    UPDATE expert_request_proposals 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = proposal_id_param;

    -- 같은 요청의 다른 모든 제안을 거절
    UPDATE expert_request_proposals 
    SET status = 'rejected', updated_at = NOW()
    WHERE request_id = request_id_param 
    AND id != proposal_id_param 
    AND status = 'pending';

    -- 요청 상태를 진행중으로 변경
    UPDATE expert_requests 
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = request_id_param;

  EXCEPTION
    WHEN OTHERS THEN
      -- 롤백은 자동으로 처리됨
      RAISE;
  END;
END;
$$;

-- 프로젝트 완료 함수 (알림 기능 제거 버전)
CREATE OR REPLACE FUNCTION complete_project(request_id_param BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 권한 확인: 요청자만 프로젝트를 완료할 수 있음
  IF NOT EXISTS (
    SELECT 1 FROM expert_requests 
    WHERE id = request_id_param 
    AND requester_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the requester can complete the project';
  END IF;

  -- 프로젝트가 진행중 상태인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM expert_requests 
    WHERE id = request_id_param 
    AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Project is not in progress';
  END IF;

  -- 프로젝트를 완료 상태로 변경
  UPDATE expert_requests 
  SET status = 'completed', updated_at = NOW()
  WHERE id = request_id_param;

END;
$$;