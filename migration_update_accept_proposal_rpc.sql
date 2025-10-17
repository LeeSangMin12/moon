-- accept_proposal RPC 함수 수정
-- 제안 수락 시 expert_request_orders 주문 생성 추가

-- 1. 기존 함수 삭제 (파라미터 명시)
DROP FUNCTION IF EXISTS public.accept_proposal(BIGINT, BIGINT);

-- 2. 새로운 함수 생성 (입금 정보 포함)
CREATE OR REPLACE FUNCTION public.accept_proposal(
  proposal_id_param BIGINT,
  request_id_param BIGINT,
  depositor_name_param VARCHAR(100),
  bank_param VARCHAR(100),
  account_number_param VARCHAR(100),
  requester_contact_param VARCHAR(200),
  special_request_param TEXT DEFAULT NULL
)
RETURNS BIGINT -- 생성된 주문 ID 반환
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_order_id BIGINT;
  v_request_title TEXT;
  v_proposed_amount INTEGER;
  v_expert_id UUID;
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

  -- 제안 정보 조회 (금액, 전문가 ID)
  SELECT proposed_amount, expert_id
  INTO v_proposed_amount, v_expert_id
  FROM expert_request_proposals
  WHERE id = proposal_id_param;

  -- 요청 제목 조회
  SELECT title
  INTO v_request_title
  FROM expert_requests
  WHERE id = request_id_param;

  -- 수수료 계산 (5%)
  v_commission_amount := FLOOR(v_proposed_amount * 0.05);

  -- 트랜잭션 시작
  BEGIN
    -- 1. 주문 생성
    INSERT INTO expert_request_orders (
      request_id,
      proposal_id,
      requester_id,
      expert_id,
      request_title,
      amount,
      commission_amount,
      total_with_commission,
      depositor_name,
      bank,
      account_number,
      requester_contact,
      special_request,
      status
    ) VALUES (
      request_id_param,
      proposal_id_param,
      auth.uid(),
      v_expert_id,
      v_request_title,
      v_proposed_amount,
      v_commission_amount,
      v_proposed_amount, -- 의뢰인이 지불하는 금액 = 제안 금액
      depositor_name_param,
      bank_param,
      account_number_param,
      requester_contact_param,
      special_request_param,
      'pending' -- 초기 상태: 입금 대기
    ) RETURNING id INTO v_order_id;

    -- 2. 선택된 제안을 수락
    UPDATE expert_request_proposals
    SET status = 'accepted', updated_at = NOW()
    WHERE id = proposal_id_param;

    -- 3. 같은 요청의 다른 모든 제안을 거절
    UPDATE expert_request_proposals
    SET status = 'rejected', updated_at = NOW()
    WHERE request_id = request_id_param
    AND id != proposal_id_param
    AND status = 'pending';

    -- 4. 요청 상태를 진행중으로 변경
    UPDATE expert_requests
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = request_id_param;

    -- 5. 요청 테이블에 수수료 정보 업데이트 (기존 로직 유지)
    UPDATE expert_requests
    SET
      total_with_commission = v_proposed_amount,
      commission_amount = v_commission_amount
    WHERE id = request_id_param;

    -- 생성된 주문 ID 반환
    RETURN v_order_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- 롤백은 자동으로 처리됨
      RAISE;
  END;
END;
$function$;

-- 코멘트 추가
COMMENT ON FUNCTION public.accept_proposal IS '제안 수락 및 주문 생성 (입금 정보 포함)';

-- 완료
SELECT 'accept_proposal RPC function updated successfully!' as status;
