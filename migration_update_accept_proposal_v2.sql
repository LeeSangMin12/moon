-- accept_proposal 함수를 단순화 (입금 정보 제거, 전문가 선택만)

CREATE OR REPLACE FUNCTION public.accept_proposal(
  proposal_id_param BIGINT,
  request_id_param BIGINT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_expert_id UUID;
  v_requester_id UUID;
  v_request_status TEXT;
BEGIN
  -- 1. 요청 정보 조회 및 검증
  SELECT requester_id, status
  INTO v_requester_id, v_request_status
  FROM expert_requests
  WHERE id = request_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request does not exist';
  END IF;

  -- 2. 요청자만 제안을 수락할 수 있음
  IF v_requester_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the requester can accept proposals';
  END IF;

  -- 3. 요청이 open 상태인지 확인
  IF v_request_status != 'open' THEN
    RAISE EXCEPTION 'Request is not open for proposals';
  END IF;

  -- 4. 제안 정보 조회
  SELECT expert_id
  INTO v_expert_id
  FROM expert_request_proposals
  WHERE id = proposal_id_param AND request_id = request_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal does not exist';
  END IF;

  -- 5. 제안 상태를 accepted로 변경
  UPDATE expert_request_proposals
  SET
    status = 'accepted',
    updated_at = NOW()
  WHERE id = proposal_id_param;

  -- 6. 다른 모든 제안을 rejected로 변경
  UPDATE expert_request_proposals
  SET
    status = 'rejected',
    updated_at = NOW()
  WHERE request_id = request_id_param
    AND id != proposal_id_param
    AND status = 'pending';

  -- 7. 요청 상태를 in_progress로 변경하고 선택된 전문가 저장
  UPDATE expert_requests
  SET
    status = 'in_progress',
    selected_expert_id = v_expert_id,
    updated_at = NOW()
  WHERE id = request_id_param;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$function$;

-- 완료
SELECT 'accept_proposal function updated! Simplified without payment info' as status;
