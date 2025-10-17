-- accept_proposal RPC 함수 수정 (간소화)
-- expert_request_orders 삭제, expert_requests에 직접 저장

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.accept_proposal(BIGINT, BIGINT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT);

-- 새로운 함수 생성
CREATE OR REPLACE FUNCTION public.accept_proposal(
  proposal_id_param BIGINT,
  request_id_param BIGINT,
  depositor_name_param VARCHAR(100),
  bank_param VARCHAR(100),
  account_number_param VARCHAR(100),
  requester_contact_param VARCHAR(200),
  special_request_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_proposed_amount INTEGER;
  v_commission_amount INTEGER;
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

  -- 제안 금액 조회
  SELECT proposed_amount
  INTO v_proposed_amount
  FROM expert_request_proposals
  WHERE id = proposal_id_param;

  -- 수수료 계산 (5%)
  v_commission_amount := FLOOR(v_proposed_amount * 0.05);

  -- 트랜잭션 시작
  BEGIN
    -- 1. 선택된 제안을 수락
    UPDATE expert_request_proposals
    SET status = 'accepted', updated_at = NOW()
    WHERE id = proposal_id_param;

    -- 2. 같은 요청의 다른 모든 제안을 거절
    UPDATE expert_request_proposals
    SET status = 'rejected', updated_at = NOW()
    WHERE request_id = request_id_param
    AND id != proposal_id_param
    AND status = 'pending';

    -- 3. 요청 상태를 진행중으로 변경하고 입금 정보 저장
    UPDATE expert_requests
    SET
      status = 'in_progress',
      total_with_commission = v_proposed_amount,
      commission_amount = v_commission_amount,
      depositor_name = depositor_name_param,
      bank = bank_param,
      account_number = account_number_param,
      requester_contact = requester_contact_param,
      special_request = special_request_param,
      order_status = 'pending',
      updated_at = NOW()
    WHERE id = request_id_param;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$function$;

COMMENT ON FUNCTION public.accept_proposal IS '제안 수락 및 입금 정보 저장 (expert_requests에 통합)';

SELECT 'accept_proposal function updated successfully!' as status;
