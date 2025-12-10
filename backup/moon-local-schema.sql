

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint, "depositor_name_param" character varying, "bank_param" character varying, "account_number_param" character varying, "requester_contact_param" character varying, "special_request_param" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint, "depositor_name_param" character varying, "bank_param" character varying, "account_number_param" character varying, "requester_contact_param" character varying, "special_request_param" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint, "depositor_name_param" character varying, "bank_param" character varying, "account_number_param" character varying, "requester_contact_param" character varying, "special_request_param" "text") IS '제안 수락 및 입금 정보 저장 (expert_requests에 통합)';



CREATE OR REPLACE FUNCTION "public"."add_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text" DEFAULT NULL::"text", "p_reference_id" bigint DEFAULT NULL::bigint, "p_description" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 현재 잔액 조회 (락)
  SELECT moon_cash INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- 새 잔액 계산
  v_new_balance := COALESCE(v_current_balance, 0) + p_amount;

  -- 잔액 업데이트
  UPDATE users SET moon_cash = v_new_balance WHERE id = p_user_id;

  -- 거래 내역 기록
  INSERT INTO cash_transactions (user_id, amount, balance_after, type, reference_type, reference_id, description)
  VALUES (p_user_id, p_amount, v_new_balance, p_type, p_reference_type, p_reference_id, p_description);

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."add_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text", "p_reference_id" bigint, "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_cash_charge"("charge_id_in" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    charge_record RECORD;
    current_user_id UUID;
    charge_amount INTEGER;
BEGIN
    -- 충전 요청 정보 조회
    SELECT user_id, amount, status 
    INTO charge_record 
    FROM cash_charges 
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
    charge_amount := charge_record.amount;
    
    -- 1. 충전 요청 상태를 'approved'로 변경
    UPDATE cash_charges 
    SET status = 'approved', 
        updated_at = NOW()
    WHERE id = charge_id_in;
    
    -- 2. 사용자의 moon_cash 증가
    UPDATE users 
    SET moon_cash = COALESCE(moon_cash, 0) + charge_amount
    WHERE id = current_user_id;
    
    -- 사용자가 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다. User ID: %', current_user_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."approve_cash_charge"("charge_id_in" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_cash_charge"("p_charge_id" bigint, "p_admin_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_charge_record RECORD;
BEGIN
  -- 충전 요청 조회
  SELECT * INTO v_charge_record
  FROM cash_charges
  WHERE id = p_charge_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Charge request not found or already processed';
  END IF;

  -- 충전 요청 상태 업데이트
  UPDATE cash_charges
  SET status = 'approved', approved_by = p_admin_id, approved_at = now(), updated_at = now()
  WHERE id = p_charge_id;

  -- 문캐시 적립
  PERFORM add_cash(
    v_charge_record.user_id,
    v_charge_record.amount,
    'charge',
    'charge',
    p_charge_id,
    '문캐시 충전'
  );

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."approve_cash_charge"("p_charge_id" bigint, "p_admin_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_cash_withdrawal"("p_withdrawal_id" bigint, "p_admin_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_withdrawal_record RECORD;
BEGIN
  -- 출금 요청 조회
  SELECT * INTO v_withdrawal_record
  FROM cash_withdrawals
  WHERE id = p_withdrawal_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found or already processed';
  END IF;

  -- 출금 요청 상태 업데이트
  UPDATE cash_withdrawals
  SET status = 'approved', approved_by = p_admin_id, approved_at = now(), updated_at = now()
  WHERE id = p_withdrawal_id;

  -- 문캐시 차감
  PERFORM deduct_cash(
    v_withdrawal_record.user_id,
    v_withdrawal_record.amount,
    'withdraw',
    'withdraw',
    p_withdrawal_id,
    '문캐시 출금'
  );

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."approve_cash_withdrawal"("p_withdrawal_id" bigint, "p_admin_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_moon_charge"("charge_id_in" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    
    -- 성공 로그
    RAISE NOTICE '문 충전 승인 완료 - User ID: %, 충전량: %, 요청 ID: %', current_user_id, charge_point, charge_id_in;
    
END;
$$;


ALTER FUNCTION "public"."approve_moon_charge"("charge_id_in" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_service_order"("order_id_in" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    order_record RECORD;
BEGIN
    -- 주문 정보 조회
    SELECT buyer_id, seller_id, service_id, total_with_commission, status 
    INTO order_record 
    FROM service_orders 
    WHERE id = order_id_in;
    
    -- 주문이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '주문을 찾을 수 없습니다. ID: %', order_id_in;
    END IF;
    
    -- 이미 처리된 주문인 경우
    IF order_record.status != 'pending' THEN
        RAISE EXCEPTION '이미 처리된 주문입니다. 현재 상태: %', order_record.status;
    END IF;
    
    -- 주문 상태를 'paid'로 변경
    UPDATE service_orders 
    SET status = 'paid', 
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = order_id_in;
    
    -- 성공 로그
    RAISE NOTICE '서비스 주문 승인 완료 - 주문 ID: %, 구매자: %, 판매자: %', 
                 order_id_in, order_record.buyer_id, order_record.seller_id;
    
END;$$;


ALTER FUNCTION "public"."approve_service_order"("order_id_in" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_service_order"("order_id_in" bigint, "reason_in" "text" DEFAULT ''::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- 주문 정보 조회
    SELECT status 
    INTO order_record 
    FROM service_orders 
    WHERE id = order_id_in;
    
    -- 주문이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '주문을 찾을 수 없습니다. ID: %', order_id_in;
    END IF;
    
    -- 이미 완료된 주문인 경우
    IF order_record.status = 'completed' THEN
        RAISE EXCEPTION '이미 완료된 주문은 취소할 수 없습니다. 현재 상태: %', order_record.status;
    END IF;
    
    -- 주문 취소 처리
    UPDATE service_orders 
    SET status = 'cancelled',
        reject_reason = reason_in,
        updated_at = NOW()
    WHERE id = order_id_in;
    
    RAISE NOTICE '서비스 주문 취소 완료 - 주문 ID: %, 취소 사유: %', order_id_in, reason_in;
    
END;
$$;


ALTER FUNCTION "public"."cancel_service_order"("order_id_in" bigint, "reason_in" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_project"("request_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."complete_project"("request_id_param" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_service_order"("order_id_in" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- 주문 정보 조회
    SELECT status 
    INTO order_record 
    FROM service_orders 
    WHERE id = order_id_in;
    
    -- 주문이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '주문을 찾을 수 없습니다. ID: %', order_id_in;
    END IF;
    
    -- 결제가 승인되지 않은 주문인 경우
    IF order_record.status != 'paid' THEN
        RAISE EXCEPTION '결제가 승인되지 않은 주문입니다. 현재 상태: %', order_record.status;
    END IF;
    
    -- 주문 상태를 'completed'로 변경
    UPDATE service_orders 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = order_id_in;
    
    RAISE NOTICE '서비스 주문 완료 - 주문 ID: %', order_id_in;
    
END;
$$;


ALTER FUNCTION "public"."complete_service_order"("order_id_in" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_notification_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text" DEFAULT NULL::"text", "p_reference_id" bigint DEFAULT NULL::bigint, "p_description" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 현재 잔액 조회 (락)
  SELECT moon_cash INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- 잔액 부족 체크
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', v_current_balance, p_amount;
  END IF;

  -- 새 잔액 계산
  v_new_balance := v_current_balance - p_amount;

  -- 잔액 업데이트
  UPDATE users SET moon_cash = v_new_balance WHERE id = p_user_id;

  -- 거래 내역 기록
  INSERT INTO cash_transactions (user_id, amount, balance_after, type, reference_type, reference_id, description)
  VALUES (p_user_id, -p_amount, v_new_balance, p_type, p_reference_type, p_reference_id, p_description);

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."deduct_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text", "p_reference_id" bigint, "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gift_moon"("sender_id_in" "uuid", "receiver_id_in" "uuid", "amount_in" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  sender_balance integer;
  receiver_balance integer;
  new_sender_balance integer;
  new_receiver_balance integer;
  sender_name text;
  receiver_name text;
begin
  if sender_id_in = receiver_id_in then
    raise exception '자기 자신에게 선물할 수 없습니다.';
  end if;

  -- Get user names and balances
  select moon_cash, name into sender_balance, sender_name from users where id = sender_id_in;
  select moon_cash, name into receiver_balance, receiver_name from users where id = receiver_id_in;

  if sender_balance is null or sender_balance < amount_in then
    raise exception '보유 캐시가 부족합니다.';
  end if;

  -- Calculate new balances
  new_sender_balance := sender_balance - amount_in;
  new_receiver_balance := COALESCE(receiver_balance, 0) + amount_in;

  -- Update balances
  update users set moon_cash = new_sender_balance where id = sender_id_in;
  update users set moon_cash = new_receiver_balance where id = receiver_id_in;

  -- Insert transaction records with user names
  insert into cash_transactions (user_id, amount, balance_after, type, description)
  values (sender_id_in, -amount_in, new_sender_balance, 'gift_send', receiver_name || '님께 선물');

  insert into cash_transactions (user_id, amount, balance_after, type, description)
  values (receiver_id_in, amount_in, new_receiver_balance, 'gift_receive', sender_name || '님이 선물');
end;
$$;


ALTER FUNCTION "public"."gift_moon"("sender_id_in" "uuid", "receiver_id_in" "uuid", "amount_in" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.users (id, full_name, meta_avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_vote"("p_post_id" bigint, "p_user_id" "uuid", "p_new_vote" smallint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  old_vote SMALLINT;
BEGIN
  -- 기존 투표 상태 조회 (없을 경우 0)
  SELECT COALESCE(
    (SELECT vote FROM post_votes 
     WHERE post_id = p_post_id AND user_id = p_user_id),
    0
  ) INTO old_vote;

  -- 투표 삭제 (기존 투표와 동일한 값으로 요청 시)
  IF old_vote = p_new_vote THEN
    UPDATE posts SET
      like_count = like_count - CASE WHEN old_vote = 1 THEN 1 ELSE 0 END,
      dislike_count = dislike_count - CASE WHEN old_vote = -1 THEN 1 ELSE 0 END
    WHERE id = p_post_id;

    -- 투표 기록 삭제
    DELETE FROM post_votes 
    WHERE post_id = p_post_id AND user_id = p_user_id;

  -- 투표 변경/새 투표
  ELSE
    UPDATE posts SET
      like_count = like_count 
        - CASE WHEN old_vote = 1 THEN 1 ELSE 0 END 
        + CASE WHEN p_new_vote = 1 THEN 1 ELSE 0 END,
      dislike_count = dislike_count 
        - CASE WHEN old_vote = -1 THEN 1 ELSE 0 END 
        + CASE WHEN p_new_vote = -1 THEN 1 ELSE 0 END
    WHERE id = p_post_id;

    -- 투표 기록 업데이트/삽입
    INSERT INTO post_votes (post_id, user_id, vote)
    VALUES (p_post_id, p_user_id, p_new_vote)
    ON CONFLICT (post_id, user_id)
    DO UPDATE SET vote = p_new_vote;
  END IF;
END;
$$;


ALTER FUNCTION "public"."handle_vote"("p_post_id" bigint, "p_user_id" "uuid", "p_new_vote" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_coupon_usage"("coupon_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE coupons
  SET current_usage_count = current_usage_count + 1,
      updated_at = NOW()
  WHERE id = coupon_id_param;
END;
$$;


ALTER FUNCTION "public"."increment_coupon_usage"("coupon_id_param" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_cash_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") RETURNS TABLE("id_out" "uuid", "user_id_out" "uuid", "amount_out" integer, "balance_out" integer, "type_out" "text", "description_out" "text", "created_at_out" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  last_balance integer;
  new_balance integer;
begin
  -- Get user's current moon_cash balance
  select moon_cash into last_balance from users where id = p_user_id;

  if last_balance is null then
    last_balance := 0;
  end if;

  new_balance := last_balance + p_amount;

  -- Update users table balance
  update users set moon_cash = new_balance where id = p_user_id;

  -- Insert transaction record and return result
  return query
    with ins as (
      insert into cash_transactions (
        user_id, amount, balance, type, description
      )
      values (
        p_user_id,
        p_amount,
        new_balance,
        p_type,
        p_description
      )
      returning id, user_id, amount, balance, type, description, created_at
    )
    select
      ins.id as id_out,
      ins.user_id as user_id_out,
      ins.amount as amount_out,
      ins.balance as balance_out,
      ins.type as type_out,
      ins.description as description_out,
      ins.created_at as created_at_out
    from ins;
end;
$$;


ALTER FUNCTION "public"."insert_cash_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_moon_point_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") RETURNS TABLE("id_out" bigint, "user_id_out" "uuid", "amount_out" integer, "balance_out" integer, "type_out" "text", "description_out" "text", "created_at_out" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
declare
  last_balance integer;
  new_balance integer;
begin
  select moon_point_transactions.balance into last_balance
  from moon_point_transactions
  where moon_point_transactions.user_id = p_user_id
  order by moon_point_transactions.created_at desc
  limit 1;

  if last_balance is null then
    last_balance := 0;
  end if;

  new_balance := last_balance + p_amount;

  -- users 테이블 잔액도 업데이트
  update users set moon_point = new_balance where id = p_user_id;

  -- 트랜잭션 기록 및 결과 반환
  return query
    with ins as (
      insert into moon_point_transactions (
        user_id, amount, balance, type, description
      )
      values (
        p_user_id,
        p_amount,
        new_balance,
        p_type,
        p_description
      )
      returning id, user_id, amount, balance, type, description, created_at
    )
    select
      ins.id as id_out,
      ins.user_id as user_id_out,
      ins.amount as amount_out,
      ins.balance as balance_out,
      ins.type as type_out,
      ins.description as description_out,
      ins.created_at as created_at_out
    from ins;
end;
$$;


ALTER FUNCTION "public"."insert_moon_point_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refund_service_order"("order_id_in" bigint, "reason_in" "text" DEFAULT ''::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- 주문 정보 조회
    SELECT status 
    INTO order_record 
    FROM service_orders 
    WHERE id = order_id_in;
    
    -- 주문이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '주문을 찾을 수 없습니다. ID: %', order_id_in;
    END IF;
    
    -- 결제되지 않은 주문인 경우
    IF order_record.status NOT IN ('paid', 'completed') THEN
        RAISE EXCEPTION '결제되지 않은 주문은 환불할 수 없습니다. 현재 상태: %', order_record.status;
    END IF;
    
    -- 주문 환불 처리
    UPDATE service_orders 
    SET status = 'refunded',
        reject_reason = reason_in,
        updated_at = NOW()
    WHERE id = order_id_in;
    
    RAISE NOTICE '서비스 주문 환불 완료 - 주문 ID: %, 환불 사유: %', order_id_in, reason_in;
    
END;
$$;


ALTER FUNCTION "public"."refund_service_order"("order_id_in" bigint, "reason_in" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_moon_charge"("charge_id_in" bigint, "reason_in" "text" DEFAULT ''::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."reject_moon_charge"("charge_id_in" bigint, "reason_in" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_push_notification_webhook"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_request_id BIGINT;
BEGIN
  -- Edge Function 비동기 호출 (pg_net 사용)
  SELECT net.http_post(
    url := 'https://xgnnhfmpporixibxpeas.supabase.co/functions/v1/push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhnbm5oZm1wcG9yaXhpYnhwZWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NTE2MSwiZXhwIjoyMDYzNTMxMTYxfQ.tKuAIV9FZxrg4dSn0QdL_ppshI4Apn-FqPW_gciUD6w'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notifications',
      'record', row_to_json(NEW),
      'schema', 'public'
    )
  ) INTO v_request_id;

  -- 로그 출력 (디버깅용)
  RAISE NOTICE 'Push notification webhook called with request_id: %', v_request_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."send_push_notification_webhook"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_push_notification_webhook"() IS 'notifications INSERT 시 Edge Function 호출하여 푸시 알림 발송';



CREATE OR REPLACE FUNCTION "public"."trigger_update_service_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."trigger_update_service_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_expert_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 전문가의 평균 평점 계산
  UPDATE users
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM expert_request_reviews
    WHERE expert_id = COALESCE(NEW.expert_id, OLD.expert_id)
  )
  WHERE id = COALESCE(NEW.expert_id, OLD.expert_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_expert_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_expert_request_orders_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_expert_request_orders_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_service_rating"("service_id_in" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_service_rating"("service_id_in" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cash_charges" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "depositor_name" character varying NOT NULL,
    "status" character varying DEFAULT 'pending'::character varying,
    "reject_reason" "text",
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "approved_at" timestamp with time zone,
    CONSTRAINT "cash_charges_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "cash_charges_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."cash_charges" OWNER TO "postgres";


COMMENT ON TABLE "public"."cash_charges" IS '문캐시 충전 요청';



CREATE SEQUENCE IF NOT EXISTS "public"."cash_charges_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cash_charges_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cash_charges_id_seq" OWNED BY "public"."cash_charges"."id";



CREATE TABLE IF NOT EXISTS "public"."cash_transactions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "type" "text" NOT NULL,
    "reference_type" "text",
    "reference_id" bigint,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cash_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."cash_transactions" IS '문캐시 거래 내역 (충전, 출금, 결제, 수익, 선물 등)';



CREATE SEQUENCE IF NOT EXISTS "public"."cash_transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cash_transactions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cash_transactions_id_seq" OWNED BY "public"."cash_transactions"."id";



CREATE TABLE IF NOT EXISTS "public"."cash_withdrawals" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bank_account_id" bigint NOT NULL,
    "amount" integer NOT NULL,
    "status" character varying DEFAULT 'pending'::character varying,
    "reject_reason" "text",
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "approved_at" timestamp with time zone,
    CONSTRAINT "cash_withdrawals_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "cash_withdrawals_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."cash_withdrawals" OWNER TO "postgres";


COMMENT ON TABLE "public"."cash_withdrawals" IS '문캐시 출금 요청';



CREATE SEQUENCE IF NOT EXISTS "public"."cash_withdrawals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cash_withdrawals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cash_withdrawals_id_seq" OWNED BY "public"."cash_withdrawals"."id";



CREATE TABLE IF NOT EXISTS "public"."coffee_chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "subject" "text" NOT NULL,
    "content" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "coffee_chats_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."coffee_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communities" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "title" "text",
    "content" "text",
    "visibility" "text" DEFAULT 'public'::"text",
    "creator_id" "uuid",
    "avatar_url" "text",
    "slug" "text"
);


ALTER TABLE "public"."communities" OWNER TO "postgres";


ALTER TABLE "public"."communities" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."communities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."community_members" (
    "community_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_reports" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "community_id" bigint NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "is_resolved" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."community_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."community_reports" IS '커뮤니티 신고 내역';



COMMENT ON COLUMN "public"."community_reports"."reporter_id" IS '신고한 사용자의 ID';



COMMENT ON COLUMN "public"."community_reports"."community_id" IS '신고된 커뮤니티의 ID';



COMMENT ON COLUMN "public"."community_reports"."reason" IS '신고 사유 (예: 스팸, 욕설 등)';



COMMENT ON COLUMN "public"."community_reports"."details" IS '신고 상세 내용';



COMMENT ON COLUMN "public"."community_reports"."is_resolved" IS '관리자가 신고를 처리했는지 여부';



ALTER TABLE "public"."community_reports" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."community_reports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."community_topics" (
    "community_id" bigint NOT NULL,
    "topic_id" bigint NOT NULL
);


ALTER TABLE "public"."community_topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" bigint NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "coupon_type" character varying(50) NOT NULL,
    "discount_type" character varying(20) NOT NULL,
    "discount_value" integer NOT NULL,
    "max_discount_amount" integer,
    "min_purchase_amount" integer DEFAULT 0,
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "max_usage_count" integer,
    "current_usage_count" integer DEFAULT 0,
    "max_usage_per_user" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."coupons_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."coupons_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."coupons_id_seq" OWNED BY "public"."coupons"."id";



CREATE TABLE IF NOT EXISTS "public"."expert_request_proposals" (
    "id" bigint NOT NULL,
    "request_id" bigint NOT NULL,
    "expert_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contact_info" "text",
    "is_secret" boolean DEFAULT false NOT NULL,
    "attachment_url" "text",
    "proposed_amount" integer,
    CONSTRAINT "expert_request_proposals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."expert_request_proposals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."expert_request_proposals"."is_secret" IS '비밀제안 여부 - true면 의뢰인만 제안 내용을 볼 수 있음';



COMMENT ON COLUMN "public"."expert_request_proposals"."attachment_url" IS '제안서 첨부 파일 URL (이력서, 포트폴리오 등)';



COMMENT ON COLUMN "public"."expert_request_proposals"."proposed_amount" IS '전문가가 제안하는 금액 (시급, 프로젝트 금액 등). NULL이면 협의';



CREATE SEQUENCE IF NOT EXISTS "public"."expert_request_proposals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."expert_request_proposals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."expert_request_proposals_id_seq" OWNED BY "public"."expert_request_proposals"."id";



CREATE TABLE IF NOT EXISTS "public"."expert_request_reviews" (
    "id" bigint NOT NULL,
    "request_id" bigint NOT NULL,
    "proposal_id" bigint NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "expert_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "title" character varying(200),
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "expert_request_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."expert_request_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."expert_request_reviews" IS '전문가 찾기 요청에 대한 리뷰';



COMMENT ON COLUMN "public"."expert_request_reviews"."reviewer_id" IS '리뷰 작성자 (요청자)';



COMMENT ON COLUMN "public"."expert_request_reviews"."expert_id" IS '리뷰 대상 (전문가)';



COMMENT ON COLUMN "public"."expert_request_reviews"."rating" IS '별점 (1-5)';



CREATE SEQUENCE IF NOT EXISTS "public"."expert_request_reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."expert_request_reviews_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."expert_request_reviews_id_seq" OWNED BY "public"."expert_request_reviews"."id";



CREATE TABLE IF NOT EXISTS "public"."expert_requests" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "category" "text",
    "description" "text" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "reward_amount" integer,
    "application_deadline" "date",
    "work_start_date" "date",
    "work_end_date" "date",
    "max_applicants" integer NOT NULL,
    "work_location" "text" NOT NULL,
    "job_type" "text" DEFAULT 'sidejob'::"text",
    "price_unit" "text" DEFAULT 'per_project'::"text",
    "selected_expert_id" "uuid",
    "is_paid" boolean DEFAULT false,
    "registration_paid_at" timestamp with time zone,
    "registration_amount" integer DEFAULT 4900,
    "payment_info" "jsonb",
    "coupon_id" bigint,
    "coupon_discount" integer DEFAULT 0,
    "reject_reason" "text",
    "posting_start_date" "date",
    "commission_rate" numeric(5,2) DEFAULT 0.05,
    "commission_amount" integer DEFAULT 0,
    "expert_payout" integer DEFAULT 0,
    "completed_at" timestamp with time zone,
    "accepted_proposal_id" bigint,
    "project_amount" integer,
    "payment_confirmed_at" timestamp with time zone,
    CONSTRAINT "chk_max_applicants" CHECK ((("max_applicants" >= 1) AND ("max_applicants" <= 100))),
    CONSTRAINT "chk_reward_amount" CHECK ((("reward_amount" >= 10000) AND ("reward_amount" <= 100000000))),
    CONSTRAINT "chk_work_dates" CHECK ((("work_start_date" IS NULL) OR ("work_end_date" IS NULL) OR ("work_end_date" >= "work_start_date"))),
    CONSTRAINT "chk_work_location_length" CHECK ((("length"(TRIM(BOTH FROM "work_location")) >= 2) AND ("length"(TRIM(BOTH FROM "work_location")) <= 100))),
    CONSTRAINT "expert_requests_job_type_check" CHECK (("job_type" = ANY (ARRAY['sidejob'::"text", 'fulltime'::"text"]))),
    CONSTRAINT "expert_requests_reward_amount_check" CHECK ((("reward_amount" IS NULL) OR (("reward_amount" >= 10000) AND ("reward_amount" <= 100000000)))),
    CONSTRAINT "expert_requests_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_payment'::"text", 'open'::"text", 'in_progress'::"text", 'completed'::"text", 'closed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."expert_requests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."expert_requests"."status" IS '공고 상태: draft(작성중), pending_payment(입금대기), open(모집중), in_progress(진행중), completed(완료), closed(마감), cancelled(취소)';



COMMENT ON COLUMN "public"."expert_requests"."reward_amount" IS '프로젝트 예산 또는 희망 연봉. NULL이면 "협의" 표시';



COMMENT ON COLUMN "public"."expert_requests"."application_deadline" IS '프로젝트 공고 종료일 (기존 모집 마감일에서 변경)';



COMMENT ON COLUMN "public"."expert_requests"."job_type" IS '작업 유형: sidejob(사이드잡) 또는 fulltime(풀타임잡)';



COMMENT ON COLUMN "public"."expert_requests"."price_unit" IS 'Price unit type: per_project, per_hour, per_page, per_day, per_month, per_year, etc.';



COMMENT ON COLUMN "public"."expert_requests"."selected_expert_id" IS 'Reference to the selected expert user';



COMMENT ON COLUMN "public"."expert_requests"."is_paid" IS '공고 등록비 결제 완료 여부';



COMMENT ON COLUMN "public"."expert_requests"."registration_paid_at" IS '공고 등록비 결제 시간';



COMMENT ON COLUMN "public"."expert_requests"."registration_amount" IS '공고 등록비 (기본 4,900원)';



COMMENT ON COLUMN "public"."expert_requests"."payment_info" IS '입금 정보 (depositor_name, bank, account_number 등)';



COMMENT ON COLUMN "public"."expert_requests"."reject_reason" IS '관리자가 공고를 거절한 경우 사유';



COMMENT ON COLUMN "public"."expert_requests"."posting_start_date" IS '프로젝트 공고 시작일';



COMMENT ON COLUMN "public"."expert_requests"."commission_rate" IS '플랫폼 수수료율 (기본 5%)';



COMMENT ON COLUMN "public"."expert_requests"."commission_amount" IS 'Platform commission (5% of project_amount)';



COMMENT ON COLUMN "public"."expert_requests"."expert_payout" IS 'Amount to be paid to expert (project_amount - commission_amount)';



COMMENT ON COLUMN "public"."expert_requests"."completed_at" IS '프로젝트 완료 일시';



COMMENT ON COLUMN "public"."expert_requests"."accepted_proposal_id" IS 'Reference to the accepted proposal';



COMMENT ON COLUMN "public"."expert_requests"."project_amount" IS 'Total project amount paid by client';



COMMENT ON COLUMN "public"."expert_requests"."payment_confirmed_at" IS 'Timestamp when admin confirmed the payment';



CREATE SEQUENCE IF NOT EXISTS "public"."expert_requests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."expert_requests_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."expert_requests_id_seq" OWNED BY "public"."expert_requests"."id";



CREATE TABLE IF NOT EXISTS "public"."moon_charges" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "point" integer NOT NULL,
    "amount" integer NOT NULL,
    "bank" character varying(50) NOT NULL,
    "account_number" character varying(50) NOT NULL,
    "account_holder" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "reject_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "moon_charges_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "moon_charges_point_check" CHECK (("point" > 0)),
    CONSTRAINT "moon_charges_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."moon_charges" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."moon_charges_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."moon_charges_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."moon_charges_id_seq" OWNED BY "public"."moon_charges"."id";



CREATE TABLE IF NOT EXISTS "public"."moon_point_transactions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "balance" integer,
    "type" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."moon_point_transactions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."moon_point_transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."moon_point_transactions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."moon_point_transactions_id_seq" OWNED BY "public"."moon_point_transactions"."id";



CREATE TABLE IF NOT EXISTS "public"."moon_withdrawals" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "bank" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_holder" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reject_reason" "text"
);


ALTER TABLE "public"."moon_withdrawals" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."moon_withdrawals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."moon_withdrawals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."moon_withdrawals_id_seq" OWNED BY "public"."moon_withdrawals"."id";



CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "user_id" "uuid" NOT NULL,
    "push_enabled" boolean DEFAULT true,
    "post_liked" boolean DEFAULT true,
    "comment_created" boolean DEFAULT true,
    "comment_reply" boolean DEFAULT true,
    "follow_created" boolean DEFAULT true,
    "order_created" boolean DEFAULT true,
    "order_approved" boolean DEFAULT true,
    "order_completed" boolean DEFAULT true,
    "review_created" boolean DEFAULT true,
    "expert_review_created" boolean DEFAULT true,
    "proposal_accepted" boolean DEFAULT true,
    "gift_received" boolean DEFAULT true,
    "coffee_chat_requested" boolean DEFAULT true,
    "coffee_chat_accepted" boolean DEFAULT true,
    "coffee_chat_rejected" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_settings" IS '사용자별 알림 설정 (푸시 알림 on/off)';



COMMENT ON COLUMN "public"."notification_settings"."push_enabled" IS '푸시 알림 전체 활성화 여부';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "type" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "text",
    "payload" "jsonb",
    "link_url" "text",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notifications_id_seq" OWNED BY "public"."notifications"."id";



CREATE TABLE IF NOT EXISTS "public"."order_options" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "option_id" bigint NOT NULL,
    "option_name" "text" NOT NULL,
    "option_price" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_options" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."order_options_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."order_options_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."order_options_id_seq" OWNED BY "public"."order_options"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."payment_transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."payment_transactions_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" bigint DEFAULT "nextval"('"public"."payment_transactions_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "merchant_uid" character varying NOT NULL,
    "imp_uid" character varying,
    "amount" integer NOT NULL,
    "currency" character varying DEFAULT 'KRW'::character varying,
    "status" character varying DEFAULT 'pending'::character varying NOT NULL,
    "payment_method" character varying,
    "pg_provider" character varying,
    "pg_tid" character varying,
    "receipt_url" "text",
    "card_name" character varying,
    "card_number" character varying,
    "cancel_reason" "text",
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_transactions_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "payment_transactions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::"text"[])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."payment_transactions" IS '포트원 결제 거래 내역';



COMMENT ON COLUMN "public"."payment_transactions"."merchant_uid" IS '가맹점 주문번호 (고유값)';



COMMENT ON COLUMN "public"."payment_transactions"."imp_uid" IS '포트원 거래 고유번호';



COMMENT ON COLUMN "public"."payment_transactions"."status" IS '거래 상태: pending(대기), completed(완료), cancelled(취소), refunded(환불)';



COMMENT ON COLUMN "public"."payment_transactions"."payment_method" IS '결제 수단: card(카드), trans(계좌이체), vbank(가상계좌) 등';



CREATE TABLE IF NOT EXISTS "public"."post_bookmarks" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_bookmarks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."post_bookmarks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."post_bookmarks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."post_bookmarks_id_seq" OWNED BY "public"."post_bookmarks"."id";



CREATE TABLE IF NOT EXISTS "public"."post_comment_votes" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment_id" bigint NOT NULL,
    "vote" smallint NOT NULL
);


ALTER TABLE "public"."post_comment_votes" OWNER TO "postgres";


ALTER TABLE "public"."post_comment_votes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."post_comment_votes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" bigint NOT NULL,
    "parent_comment_id" bigint,
    "content" "text" NOT NULL,
    "gift_amount" bigint,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


ALTER TABLE "public"."post_comments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."post_comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."post_reports" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "post_id" bigint NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "is_resolved" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."post_reports" OWNER TO "postgres";


ALTER TABLE "public"."post_reports" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."post_reports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."post_votes" (
    "post_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vote" smallint,
    "voted_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."post_votes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."post_votes"."vote" IS '1: 추천, -1: 비추천';



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" bigint NOT NULL,
    "author_id" "uuid",
    "community_id" bigint,
    "title" "text",
    "content" "text",
    "visibility" "text" DEFAULT 'public'::"text",
    "like_count" integer DEFAULT 0,
    "dislike_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "bookmark_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "images" "jsonb"
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


ALTER TABLE "public"."posts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."posts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."proposal_attachments" (
    "id" bigint NOT NULL,
    "proposal_id" bigint NOT NULL,
    "file_url" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "file_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_file_size" CHECK ((("file_size" > 0) AND ("file_size" <= 10485760)))
);


ALTER TABLE "public"."proposal_attachments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."proposal_attachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."proposal_attachments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."proposal_attachments_id_seq" OWNED BY "public"."proposal_attachments"."id";



CREATE TABLE IF NOT EXISTS "public"."seller_settlements" (
    "id" bigint NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "bank" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_holder" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reject_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    CONSTRAINT "seller_settlements_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "seller_settlements_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."seller_settlements" OWNER TO "postgres";


COMMENT ON TABLE "public"."seller_settlements" IS '판매자 정산 신청 내역';



COMMENT ON COLUMN "public"."seller_settlements"."amount" IS '정산 금액 (원)';



COMMENT ON COLUMN "public"."seller_settlements"."status" IS '정산 상태: pending(대기), approved(승인), rejected(거절)';



CREATE SEQUENCE IF NOT EXISTS "public"."seller_settlements_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."seller_settlements_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."seller_settlements_id_seq" OWNED BY "public"."seller_settlements"."id";



CREATE TABLE IF NOT EXISTS "public"."service_likes" (
    "id" bigint NOT NULL,
    "service_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "liked_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_likes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."service_likes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."service_likes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."service_likes_id_seq" OWNED BY "public"."service_likes"."id";



CREATE TABLE IF NOT EXISTS "public"."service_options" (
    "id" bigint NOT NULL,
    "service_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "price_add" integer DEFAULT 0 NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_options" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."service_options_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."service_options_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."service_options_id_seq" OWNED BY "public"."service_options"."id";



CREATE TABLE IF NOT EXISTS "public"."service_orders" (
    "id" bigint NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "service_id" bigint NOT NULL,
    "service_title" character varying(255) NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" integer NOT NULL,
    "total_with_commission" integer NOT NULL,
    "depositor_name" character varying(50) NOT NULL,
    "bank" character varying(50) NOT NULL,
    "account_number" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "special_request" "text",
    "reject_reason" "text",
    "admin_memo" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "paid_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "buyer_contact" character varying(50),
    "commission_amount" bigint,
    "coupon_id" bigint,
    "coupon_discount" integer DEFAULT 0,
    CONSTRAINT "service_orders_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "service_orders_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::"text"[]))),
    CONSTRAINT "service_orders_total_amount_check" CHECK (("total_with_commission" > 0)),
    CONSTRAINT "service_orders_unit_price_check" CHECK (("unit_price" > 0))
);


ALTER TABLE "public"."service_orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."service_orders"."buyer_contact" IS '구매자 연락처 (전화번호, 이메일 등)';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "name" "text",
    "full_name" "text",
    "avatar_url" "text" DEFAULT ''::"text",
    "handle" "text",
    "gender" "text" DEFAULT '남자'::"text",
    "birth_date" "date" DEFAULT '2000-01-01'::"date",
    "self_introduction" "text",
    "deleted_at" timestamp with time zone,
    "phone" "text",
    "banner_url" "text",
    "rating" numeric DEFAULT '0'::numeric,
    "moon_cash" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text",
    "meta_avatar_url" "text",
    "email" "text",
    CONSTRAINT "users_gender_check" CHECK (("gender" = ANY (ARRAY['남자'::"text", '여자'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."full_name" IS '가입시 받아오는 이름';



COMMENT ON COLUMN "public"."users"."email" IS '사용자 이메일 주소';



CREATE OR REPLACE VIEW "public"."service_order_stats" AS
 SELECT "u"."id" AS "user_id",
    "u"."handle",
    "u"."name",
    COALESCE("sum"(
        CASE
            WHEN (("so_buyer"."status")::"text" = 'completed'::"text") THEN "so_buyer"."total_with_commission"
            ELSE 0
        END), (0)::bigint) AS "total_purchased_amount",
    "count"(
        CASE
            WHEN (("so_buyer"."status")::"text" = 'pending'::"text") THEN 1
            ELSE NULL::integer
        END) AS "pending_purchases",
    "count"(
        CASE
            WHEN (("so_buyer"."status")::"text" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "completed_purchases",
    COALESCE("sum"(
        CASE
            WHEN (("so_seller"."status")::"text" = 'completed'::"text") THEN "so_seller"."total_with_commission"
            ELSE 0
        END), (0)::bigint) AS "total_sales_amount",
    "count"(
        CASE
            WHEN (("so_seller"."status")::"text" = 'pending'::"text") THEN 1
            ELSE NULL::integer
        END) AS "pending_sales",
    "count"(
        CASE
            WHEN (("so_seller"."status")::"text" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "completed_sales"
   FROM (("public"."users" "u"
     LEFT JOIN "public"."service_orders" "so_buyer" ON (("u"."id" = "so_buyer"."buyer_id")))
     LEFT JOIN "public"."service_orders" "so_seller" ON (("u"."id" = "so_seller"."seller_id")))
  GROUP BY "u"."id", "u"."handle", "u"."name";


ALTER VIEW "public"."service_order_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."service_orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."service_orders_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."service_orders_id_seq" OWNED BY "public"."service_orders"."id";



CREATE TABLE IF NOT EXISTS "public"."service_reviews" (
    "id" bigint NOT NULL,
    "service_id" bigint NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "order_id" bigint,
    "rating" integer NOT NULL,
    "title" character varying(255),
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."service_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" bigint NOT NULL,
    "author_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text",
    "price" integer NOT NULL,
    "images" "jsonb",
    "rating" numeric DEFAULT 0 NOT NULL,
    "rating_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text",
    "contact_info" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."services" OWNER TO "postgres";


COMMENT ON COLUMN "public"."services"."contact_info" IS '문의 URL';



CREATE OR REPLACE VIEW "public"."service_review_stats" AS
 SELECT "s"."id" AS "service_id",
    "s"."title" AS "service_title",
    "s"."rating",
    "s"."rating_count",
    "count"(
        CASE
            WHEN ("sr"."rating" = 5) THEN 1
            ELSE NULL::integer
        END) AS "five_star_count",
    "count"(
        CASE
            WHEN ("sr"."rating" = 4) THEN 1
            ELSE NULL::integer
        END) AS "four_star_count",
    "count"(
        CASE
            WHEN ("sr"."rating" = 3) THEN 1
            ELSE NULL::integer
        END) AS "three_star_count",
    "count"(
        CASE
            WHEN ("sr"."rating" = 2) THEN 1
            ELSE NULL::integer
        END) AS "two_star_count",
    "count"(
        CASE
            WHEN ("sr"."rating" = 1) THEN 1
            ELSE NULL::integer
        END) AS "one_star_count"
   FROM ("public"."services" "s"
     LEFT JOIN "public"."service_reviews" "sr" ON (("s"."id" = "sr"."service_id")))
  GROUP BY "s"."id", "s"."title", "s"."rating", "s"."rating_count";


ALTER VIEW "public"."service_review_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."service_reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."service_reviews_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."service_reviews_id_seq" OWNED BY "public"."service_reviews"."id";



ALTER TABLE "public"."services" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."services_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."settlement_orders" (
    "settlement_id" bigint NOT NULL,
    "order_id" bigint NOT NULL
);


ALTER TABLE "public"."settlement_orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."settlement_orders" IS '정산에 포함된 주문 매핑';



CREATE TABLE IF NOT EXISTS "public"."topic_categories" (
    "id" bigint NOT NULL,
    "name" "text",
    "emoji" "text"
);


ALTER TABLE "public"."topic_categories" OWNER TO "postgres";


ALTER TABLE "public"."topic_categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."topic_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."topics" (
    "id" bigint NOT NULL,
    "name" "text",
    "topic_category_id" bigint
);


ALTER TABLE "public"."topics" OWNER TO "postgres";


ALTER TABLE "public"."topics" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."topics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_bank_accounts" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_type" "text" DEFAULT 'individual'::"text" NOT NULL,
    "bank" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_holder" "text" NOT NULL,
    "resident_number" "text",
    "business_number" "text",
    "is_default" boolean DEFAULT true,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_bank_accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_bank_accounts" IS '사용자 출금 계좌 정보';



CREATE SEQUENCE IF NOT EXISTS "public"."user_bank_accounts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_bank_accounts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_bank_accounts_id_seq" OWNED BY "public"."user_bank_accounts"."id";



CREATE OR REPLACE VIEW "public"."user_charge_stats" AS
 SELECT "u"."id" AS "user_id",
    "u"."handle",
    "u"."name",
    COALESCE("sum"(
        CASE
            WHEN (("mc"."status")::"text" = 'approved'::"text") THEN "mc"."point"
            ELSE 0
        END), (0)::bigint) AS "total_charged_points",
    COALESCE("sum"(
        CASE
            WHEN (("mc"."status")::"text" = 'approved'::"text") THEN "mc"."amount"
            ELSE 0
        END), (0)::bigint) AS "total_charged_amount",
    "count"(
        CASE
            WHEN (("mc"."status")::"text" = 'pending'::"text") THEN 1
            ELSE NULL::integer
        END) AS "pending_requests",
    "count"(
        CASE
            WHEN (("mc"."status")::"text" = 'approved'::"text") THEN 1
            ELSE NULL::integer
        END) AS "approved_requests",
    "count"(
        CASE
            WHEN (("mc"."status")::"text" = 'rejected'::"text") THEN 1
            ELSE NULL::integer
        END) AS "rejected_requests"
   FROM ("public"."users" "u"
     LEFT JOIN "public"."moon_charges" "mc" ON (("u"."id" = "mc"."user_id")))
  GROUP BY "u"."id", "u"."handle", "u"."name";


ALTER VIEW "public"."user_charge_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_coupons" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "coupon_id" bigint NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"(),
    "order_id" bigint,
    "expert_request_id" bigint,
    "discount_amount" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_coupons" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_coupons_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_coupons_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_coupons_id_seq" OWNED BY "public"."user_coupons"."id";



CREATE TABLE IF NOT EXISTS "public"."user_devices" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "fcm_token" "text" NOT NULL,
    "device_type" "text",
    "device_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_devices_device_type_check" CHECK (("device_type" = ANY (ARRAY['android'::"text", 'ios'::"text", 'web'::"text"])))
);


ALTER TABLE "public"."user_devices" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_devices" IS '사용자 디바이스 FCM 토큰 저장 (푸시 알림용)';



COMMENT ON COLUMN "public"."user_devices"."fcm_token" IS 'Firebase Cloud Messaging 토큰';



COMMENT ON COLUMN "public"."user_devices"."device_type" IS '디바이스 타입: android, ios, web';



COMMENT ON COLUMN "public"."user_devices"."device_name" IS '디바이스 이름 (예: Samsung Galaxy S21, iPhone 13)';



CREATE SEQUENCE IF NOT EXISTS "public"."user_devices_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_devices_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_devices_id_seq" OWNED BY "public"."user_devices"."id";



CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reports" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "is_resolved" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."user_reports" OWNER TO "postgres";


ALTER TABLE "public"."user_reports" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_reports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."cash_charges" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cash_charges_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cash_transactions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cash_transactions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cash_withdrawals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cash_withdrawals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."coupons" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."coupons_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."expert_request_proposals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."expert_request_proposals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."expert_request_reviews" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."expert_request_reviews_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."expert_requests" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."expert_requests_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."moon_charges" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."moon_charges_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."moon_point_transactions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."moon_point_transactions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."moon_withdrawals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."moon_withdrawals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_options" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_options_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."post_bookmarks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."post_bookmarks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."proposal_attachments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."proposal_attachments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."seller_settlements" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."seller_settlements_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."service_likes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."service_likes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."service_options" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."service_options_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."service_orders" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."service_orders_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."service_reviews" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."service_reviews_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_bank_accounts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_bank_accounts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_coupons" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_coupons_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_devices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_devices_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cash_charges"
    ADD CONSTRAINT "cash_charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cash_transactions"
    ADD CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cash_withdrawals"
    ADD CONSTRAINT "cash_withdrawals_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."expert_requests"
    ADD CONSTRAINT "chk_application_deadline" CHECK ((("application_deadline" IS NULL) OR ("application_deadline" >= CURRENT_DATE) OR ("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))) NOT VALID;



ALTER TABLE ONLY "public"."coffee_chats"
    ADD CONSTRAINT "coffee_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_pkey" PRIMARY KEY ("community_id", "user_id");



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_topics"
    ADD CONSTRAINT "community_topics_pkey" PRIMARY KEY ("community_id", "topic_id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expert_request_proposals"
    ADD CONSTRAINT "expert_request_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expert_request_proposals"
    ADD CONSTRAINT "expert_request_proposals_request_id_expert_id_key" UNIQUE ("request_id", "expert_id");



ALTER TABLE ONLY "public"."expert_request_reviews"
    ADD CONSTRAINT "expert_request_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expert_request_reviews"
    ADD CONSTRAINT "expert_request_reviews_request_id_reviewer_id_key" UNIQUE ("request_id", "reviewer_id");



ALTER TABLE ONLY "public"."expert_requests"
    ADD CONSTRAINT "expert_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moon_charges"
    ADD CONSTRAINT "moon_charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moon_point_transactions"
    ADD CONSTRAINT "moon_point_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moon_withdrawals"
    ADD CONSTRAINT "moon_withdrawals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_options"
    ADD CONSTRAINT "order_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_imp_uid_key" UNIQUE ("imp_uid");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_merchant_uid_key" UNIQUE ("merchant_uid");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_bookmarks"
    ADD CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_comment_votes"
    ADD CONSTRAINT "post_comment_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_reports"
    ADD CONSTRAINT "post_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_votes"
    ADD CONSTRAINT "post_votes_pkey" PRIMARY KEY ("post_id", "user_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."proposal_attachments"
    ADD CONSTRAINT "proposal_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seller_settlements"
    ADD CONSTRAINT "seller_settlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_likes"
    ADD CONSTRAINT "service_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_options"
    ADD CONSTRAINT "service_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settlement_orders"
    ADD CONSTRAINT "settlement_orders_pkey" PRIMARY KEY ("settlement_id", "order_id");



ALTER TABLE ONLY "public"."topic_categories"
    ADD CONSTRAINT "topic_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_likes"
    ADD CONSTRAINT "unique_service_user" UNIQUE ("service_id", "user_id");



ALTER TABLE ONLY "public"."post_comment_votes"
    ADD CONSTRAINT "unique_user_comment_vote" UNIQUE ("user_id", "comment_id");



ALTER TABLE ONLY "public"."post_bookmarks"
    ADD CONSTRAINT "unique_user_post" UNIQUE ("user_id", "post_id");



ALTER TABLE ONLY "public"."user_bank_accounts"
    ADD CONSTRAINT "user_bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_fcm_token_key" UNIQUE ("fcm_token");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_handle_key" UNIQUE ("handle");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



CREATE INDEX "idx_cash_charges_status" ON "public"."cash_charges" USING "btree" ("status");



CREATE INDEX "idx_cash_charges_user_id" ON "public"."cash_charges" USING "btree" ("user_id");



CREATE INDEX "idx_cash_transactions_created_at" ON "public"."cash_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_cash_transactions_type" ON "public"."cash_transactions" USING "btree" ("type");



CREATE INDEX "idx_cash_transactions_user_id" ON "public"."cash_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_cash_withdrawals_status" ON "public"."cash_withdrawals" USING "btree" ("status");



CREATE INDEX "idx_cash_withdrawals_user_id" ON "public"."cash_withdrawals" USING "btree" ("user_id");



CREATE INDEX "idx_coffee_chats_created_at" ON "public"."coffee_chats" USING "btree" ("created_at");



CREATE INDEX "idx_coffee_chats_recipient_id" ON "public"."coffee_chats" USING "btree" ("recipient_id");



CREATE INDEX "idx_coffee_chats_sender_id" ON "public"."coffee_chats" USING "btree" ("sender_id");



CREATE INDEX "idx_coffee_chats_status" ON "public"."coffee_chats" USING "btree" ("status");



CREATE INDEX "idx_communities_creator_id" ON "public"."communities" USING "btree" ("creator_id");



CREATE INDEX "idx_coupons_code" ON "public"."coupons" USING "btree" ("code");



CREATE INDEX "idx_coupons_type" ON "public"."coupons" USING "btree" ("coupon_type");



CREATE INDEX "idx_expert_request_proposals_expert_id" ON "public"."expert_request_proposals" USING "btree" ("expert_id");



CREATE INDEX "idx_expert_request_proposals_is_secret" ON "public"."expert_request_proposals" USING "btree" ("is_secret");



CREATE INDEX "idx_expert_request_proposals_request_id" ON "public"."expert_request_proposals" USING "btree" ("request_id");



CREATE INDEX "idx_expert_request_proposals_status" ON "public"."expert_request_proposals" USING "btree" ("status");



CREATE INDEX "idx_expert_request_reviews_expert" ON "public"."expert_request_reviews" USING "btree" ("expert_id");



CREATE INDEX "idx_expert_request_reviews_proposal" ON "public"."expert_request_reviews" USING "btree" ("proposal_id");



CREATE INDEX "idx_expert_request_reviews_request" ON "public"."expert_request_reviews" USING "btree" ("request_id");



CREATE INDEX "idx_expert_request_reviews_reviewer" ON "public"."expert_request_reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_expert_requests_accepted_proposal_id" ON "public"."expert_requests" USING "btree" ("accepted_proposal_id");



CREATE INDEX "idx_expert_requests_application_deadline" ON "public"."expert_requests" USING "btree" ("application_deadline");



CREATE INDEX "idx_expert_requests_category" ON "public"."expert_requests" USING "btree" ("category");



CREATE INDEX "idx_expert_requests_created_at" ON "public"."expert_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_expert_requests_is_paid" ON "public"."expert_requests" USING "btree" ("is_paid") WHERE ("is_paid" = true);



CREATE INDEX "idx_expert_requests_job_type" ON "public"."expert_requests" USING "btree" ("job_type");



CREATE INDEX "idx_expert_requests_requester_id" ON "public"."expert_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_expert_requests_reward_amount" ON "public"."expert_requests" USING "btree" ("reward_amount");



CREATE INDEX "idx_expert_requests_selected_expert" ON "public"."expert_requests" USING "btree" ("selected_expert_id") WHERE ("selected_expert_id" IS NOT NULL);



CREATE INDEX "idx_expert_requests_selected_expert_id" ON "public"."expert_requests" USING "btree" ("selected_expert_id");



CREATE INDEX "idx_expert_requests_status" ON "public"."expert_requests" USING "btree" ("status");



CREATE INDEX "idx_expert_requests_work_location" ON "public"."expert_requests" USING "btree" ("work_location");



CREATE INDEX "idx_expert_requests_work_start_date" ON "public"."expert_requests" USING "btree" ("work_start_date");



CREATE INDEX "idx_moon_charges_created_at" ON "public"."moon_charges" USING "btree" ("created_at");



CREATE INDEX "idx_moon_charges_status" ON "public"."moon_charges" USING "btree" ("status");



CREATE INDEX "idx_moon_charges_user_id" ON "public"."moon_charges" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_recipient_created_at" ON "public"."notifications" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_notifications_recipient_id_id" ON "public"."notifications" USING "btree" ("recipient_id", "id" DESC);



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("recipient_id", "read_at");



CREATE INDEX "idx_order_options_order_id" ON "public"."order_options" USING "btree" ("order_id");



CREATE INDEX "idx_post_comments_post_id_id" ON "public"."post_comments" USING "btree" ("post_id", "id");



CREATE INDEX "idx_post_comments_user_id_created_at" ON "public"."post_comments" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_post_votes_user_post" ON "public"."post_votes" USING "btree" ("user_id", "post_id");



CREATE INDEX "idx_posts_author_id_id" ON "public"."posts" USING "btree" ("author_id", "id" DESC);



CREATE INDEX "idx_posts_community_id_created_at" ON "public"."posts" USING "btree" ("community_id", "created_at" DESC);



CREATE INDEX "idx_posts_community_id_id" ON "public"."posts" USING "btree" ("community_id", "id" DESC);



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_id_created_at" ON "public"."posts" USING "btree" ("id", "created_at" DESC);



CREATE INDEX "idx_posts_id_desc" ON "public"."posts" USING "btree" ("id" DESC);



CREATE INDEX "idx_proposal_attachments_created_at" ON "public"."proposal_attachments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_proposal_attachments_proposal_id" ON "public"."proposal_attachments" USING "btree" ("proposal_id");



CREATE INDEX "idx_seller_settlements_seller_id" ON "public"."seller_settlements" USING "btree" ("seller_id");



CREATE INDEX "idx_seller_settlements_status" ON "public"."seller_settlements" USING "btree" ("status");



CREATE INDEX "idx_service_likes_user_id" ON "public"."service_likes" USING "btree" ("user_id");



CREATE INDEX "idx_service_options_service_id" ON "public"."service_options" USING "btree" ("service_id");



CREATE INDEX "idx_service_orders_buyer_id" ON "public"."service_orders" USING "btree" ("buyer_id");



CREATE INDEX "idx_service_orders_created_at" ON "public"."service_orders" USING "btree" ("created_at");



CREATE INDEX "idx_service_orders_seller_id" ON "public"."service_orders" USING "btree" ("seller_id");



CREATE INDEX "idx_service_orders_service_id" ON "public"."service_orders" USING "btree" ("service_id");



CREATE INDEX "idx_service_orders_status" ON "public"."service_orders" USING "btree" ("status");



CREATE INDEX "idx_service_reviews_created_at" ON "public"."service_reviews" USING "btree" ("created_at");



CREATE INDEX "idx_service_reviews_rating" ON "public"."service_reviews" USING "btree" ("rating");



CREATE INDEX "idx_service_reviews_reviewer_id" ON "public"."service_reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_service_reviews_service_id" ON "public"."service_reviews" USING "btree" ("service_id");



CREATE INDEX "idx_service_reviews_service_id_id" ON "public"."service_reviews" USING "btree" ("service_id", "id" DESC);



CREATE INDEX "idx_services_author_id_created_at" ON "public"."services" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "idx_services_created_at" ON "public"."services" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_services_id_created_at" ON "public"."services" USING "btree" ("id", "created_at" DESC);



CREATE INDEX "idx_services_id_desc" ON "public"."services" USING "btree" ("id" DESC);



CREATE INDEX "idx_settlement_orders_order_id" ON "public"."settlement_orders" USING "btree" ("order_id");



CREATE INDEX "idx_user_bank_accounts_user_id" ON "public"."user_bank_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_user_coupons_coupon_id" ON "public"."user_coupons" USING "btree" ("coupon_id");



CREATE INDEX "idx_user_coupons_user_id" ON "public"."user_coupons" USING "btree" ("user_id");



CREATE INDEX "idx_user_devices_fcm_token" ON "public"."user_devices" USING "btree" ("fcm_token");



CREATE INDEX "idx_user_devices_user_id" ON "public"."user_devices" USING "btree" ("user_id");



CREATE INDEX "idx_user_follows_following_id" ON "public"."user_follows" USING "btree" ("following_id");



COMMENT ON INDEX "public"."idx_user_follows_following_id" IS 'Optimizes queries for fetching followers list (who follows this user)';



CREATE INDEX "payment_transactions_created_at_idx" ON "public"."payment_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "payment_transactions_merchant_uid_idx" ON "public"."payment_transactions" USING "btree" ("merchant_uid");



CREATE INDEX "payment_transactions_status_idx" ON "public"."payment_transactions" USING "btree" ("status");



CREATE INDEX "payment_transactions_user_id_idx" ON "public"."payment_transactions" USING "btree" ("user_id");



CREATE INDEX "posts_title_trgm_idx" ON "public"."posts" USING "gin" ("title" "extensions"."gin_trgm_ops");



CREATE UNIQUE INDEX "service_reviews_order_id_unique" ON "public"."service_reviews" USING "btree" ("order_id") WHERE ("order_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "service_reviews_rating_update_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."service_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_service_rating"();



CREATE OR REPLACE TRIGGER "trigger_create_notification_settings" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_settings"();



CREATE OR REPLACE TRIGGER "trigger_send_push_notification" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."send_push_notification_webhook"();



CREATE OR REPLACE TRIGGER "trigger_update_expert_rating" AFTER INSERT OR DELETE OR UPDATE ON "public"."expert_request_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_expert_rating"();



CREATE OR REPLACE TRIGGER "update_coffee_chats_updated_at" BEFORE UPDATE ON "public"."coffee_chats" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_moon_charges_updated_at" BEFORE UPDATE ON "public"."moon_charges" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_service_orders_updated_at" BEFORE UPDATE ON "public"."service_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_service_reviews_updated_at" BEFORE UPDATE ON "public"."service_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."cash_charges"
    ADD CONSTRAINT "cash_charges_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cash_charges"
    ADD CONSTRAINT "cash_charges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cash_transactions"
    ADD CONSTRAINT "cash_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cash_withdrawals"
    ADD CONSTRAINT "cash_withdrawals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cash_withdrawals"
    ADD CONSTRAINT "cash_withdrawals_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."user_bank_accounts"("id");



ALTER TABLE ONLY "public"."cash_withdrawals"
    ADD CONSTRAINT "cash_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."coffee_chats"
    ADD CONSTRAINT "coffee_chats_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coffee_chats"
    ADD CONSTRAINT "coffee_chats_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_topics"
    ADD CONSTRAINT "community_topics_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_topics"
    ADD CONSTRAINT "community_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_request_proposals"
    ADD CONSTRAINT "expert_request_proposals_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_request_proposals"
    ADD CONSTRAINT "expert_request_proposals_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."expert_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_request_reviews"
    ADD CONSTRAINT "expert_request_reviews_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_request_reviews"
    ADD CONSTRAINT "expert_request_reviews_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."expert_request_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_request_reviews"
    ADD CONSTRAINT "expert_request_reviews_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."expert_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_request_reviews"
    ADD CONSTRAINT "expert_request_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_requests"
    ADD CONSTRAINT "expert_requests_accepted_proposal_id_fkey" FOREIGN KEY ("accepted_proposal_id") REFERENCES "public"."expert_request_proposals"("id");



ALTER TABLE ONLY "public"."expert_requests"
    ADD CONSTRAINT "expert_requests_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id");



ALTER TABLE ONLY "public"."expert_requests"
    ADD CONSTRAINT "expert_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_requests"
    ADD CONSTRAINT "expert_requests_selected_expert_id_fkey" FOREIGN KEY ("selected_expert_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."post_bookmarks"
    ADD CONSTRAINT "fk_post" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_likes"
    ADD CONSTRAINT "fk_service" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_bookmarks"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_likes"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moon_charges"
    ADD CONSTRAINT "moon_charges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moon_point_transactions"
    ADD CONSTRAINT "moon_point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."moon_withdrawals"
    ADD CONSTRAINT "moon_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_options"
    ADD CONSTRAINT "order_options_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."service_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_options"
    ADD CONSTRAINT "order_options_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."post_comment_votes"
    ADD CONSTRAINT "post_comment_votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comment_votes"
    ADD CONSTRAINT "post_comment_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comment_votes"
    ADD CONSTRAINT "post_comment_votes_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reports"
    ADD CONSTRAINT "post_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reports"
    ADD CONSTRAINT "post_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_votes"
    ADD CONSTRAINT "post_votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_votes"
    ADD CONSTRAINT "post_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_attachments"
    ADD CONSTRAINT "proposal_attachments_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."expert_request_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_settlements"
    ADD CONSTRAINT "seller_settlements_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."service_options"
    ADD CONSTRAINT "service_options_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settlement_orders"
    ADD CONSTRAINT "settlement_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id");



ALTER TABLE ONLY "public"."settlement_orders"
    ADD CONSTRAINT "settlement_orders_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "public"."seller_settlements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_topic_category_id_fkey" FOREIGN KEY ("topic_category_id") REFERENCES "public"."topic_categories"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_bank_accounts"
    ADD CONSTRAINT "user_bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id");



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_expert_request_id_fkey" FOREIGN KEY ("expert_request_id") REFERENCES "public"."expert_requests"("id");



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id");



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_reporter_id_fkey1" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can insert proposal attachments" ON "public"."proposal_attachments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."expert_request_proposals"
  WHERE (("expert_request_proposals"."id" = "proposal_attachments"."proposal_id") AND ("expert_request_proposals"."expert_id" = "auth"."uid"())))));



CREATE POLICY "Enable read access for all users" ON "public"."topic_categories" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."topics" FOR SELECT USING (true);



CREATE POLICY "Everyone can view proposal attachments" ON "public"."proposal_attachments" FOR SELECT USING (true);



CREATE POLICY "Proposal owners can delete their attachments" ON "public"."proposal_attachments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."expert_request_proposals"
  WHERE (("expert_request_proposals"."id" = "proposal_attachments"."proposal_id") AND ("expert_request_proposals"."expert_id" = "auth"."uid"())))));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile." ON "public"."users" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update own profile." ON "public"."users" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "moon_charges_admin_policy" ON "public"."moon_charges" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role" = 'admin'::"text") OR ("users"."role" = 'super_admin'::"text"))))));



CREATE POLICY "moon_charges_insert_policy" ON "public"."moon_charges" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "moon_charges_user_policy" ON "public"."moon_charges" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."proposal_attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read own notifications" ON "public"."notifications" FOR SELECT USING (("recipient_id" = "auth"."uid"()));



ALTER TABLE "public"."service_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_orders_admin_policy" ON "public"."service_orders" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "service_orders_insert_policy" ON "public"."service_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "service_orders_update_policy" ON "public"."service_orders" FOR UPDATE USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "service_orders_user_policy" ON "public"."service_orders" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "service_reviews_admin_policy" ON "public"."service_reviews" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "service_reviews_delete_policy" ON "public"."service_reviews" FOR DELETE USING (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "service_reviews_insert_policy" ON "public"."service_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "service_reviews_select_policy" ON "public"."service_reviews" FOR SELECT USING (true);



CREATE POLICY "service_reviews_update_policy" ON "public"."service_reviews" FOR UPDATE USING (("auth"."uid"() = "reviewer_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































































































































GRANT ALL ON FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint, "depositor_name_param" character varying, "bank_param" character varying, "account_number_param" character varying, "requester_contact_param" character varying, "special_request_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint, "depositor_name_param" character varying, "bank_param" character varying, "account_number_param" character varying, "requester_contact_param" character varying, "special_request_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_proposal"("proposal_id_param" bigint, "request_id_param" bigint, "depositor_name_param" character varying, "bank_param" character varying, "account_number_param" character varying, "requester_contact_param" character varying, "special_request_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text", "p_reference_id" bigint, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text", "p_reference_id" bigint, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text", "p_reference_id" bigint, "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_cash_charge"("charge_id_in" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_cash_charge"("charge_id_in" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_cash_charge"("charge_id_in" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_cash_charge"("p_charge_id" bigint, "p_admin_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_cash_charge"("p_charge_id" bigint, "p_admin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_cash_charge"("p_charge_id" bigint, "p_admin_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_cash_withdrawal"("p_withdrawal_id" bigint, "p_admin_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_cash_withdrawal"("p_withdrawal_id" bigint, "p_admin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_cash_withdrawal"("p_withdrawal_id" bigint, "p_admin_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_moon_charge"("charge_id_in" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."approve_moon_charge"("charge_id_in" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_moon_charge"("charge_id_in" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_service_order"("order_id_in" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."approve_service_order"("order_id_in" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_service_order"("order_id_in" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_service_order"("order_id_in" bigint, "reason_in" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_service_order"("order_id_in" bigint, "reason_in" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_service_order"("order_id_in" bigint, "reason_in" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_project"("request_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_project"("request_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_project"("request_id_param" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_service_order"("order_id_in" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_service_order"("order_id_in" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_service_order"("order_id_in" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text", "p_reference_id" bigint, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text", "p_reference_id" bigint, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_cash"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_reference_type" "text", "p_reference_id" bigint, "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."gift_moon"("sender_id_in" "uuid", "receiver_id_in" "uuid", "amount_in" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gift_moon"("sender_id_in" "uuid", "receiver_id_in" "uuid", "amount_in" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gift_moon"("sender_id_in" "uuid", "receiver_id_in" "uuid", "amount_in" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_vote"("p_post_id" bigint, "p_user_id" "uuid", "p_new_vote" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."handle_vote"("p_post_id" bigint, "p_user_id" "uuid", "p_new_vote" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_vote"("p_post_id" bigint, "p_user_id" "uuid", "p_new_vote" smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_coupon_usage"("coupon_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_coupon_usage"("coupon_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_coupon_usage"("coupon_id_param" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_cash_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_cash_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_cash_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_moon_point_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_moon_point_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_moon_point_transaction"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refund_service_order"("order_id_in" bigint, "reason_in" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refund_service_order"("order_id_in" bigint, "reason_in" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_service_order"("order_id_in" bigint, "reason_in" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_moon_charge"("charge_id_in" bigint, "reason_in" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_moon_charge"("charge_id_in" bigint, "reason_in" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_moon_charge"("charge_id_in" bigint, "reason_in" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_push_notification_webhook"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_push_notification_webhook"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_push_notification_webhook"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_service_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_service_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_service_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_expert_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_expert_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_expert_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_expert_request_orders_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_expert_request_orders_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_expert_request_orders_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_service_rating"("service_id_in" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_service_rating"("service_id_in" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_service_rating"("service_id_in" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."cash_charges" TO "anon";
GRANT ALL ON TABLE "public"."cash_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_charges" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cash_charges_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cash_charges_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cash_charges_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cash_transactions" TO "anon";
GRANT ALL ON TABLE "public"."cash_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cash_transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cash_transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cash_transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cash_withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."cash_withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_withdrawals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cash_withdrawals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cash_withdrawals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cash_withdrawals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."coffee_chats" TO "anon";
GRANT ALL ON TABLE "public"."coffee_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."coffee_chats" TO "service_role";



GRANT ALL ON TABLE "public"."communities" TO "anon";
GRANT ALL ON TABLE "public"."communities" TO "authenticated";
GRANT ALL ON TABLE "public"."communities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."communities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."communities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."communities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."community_members" TO "anon";
GRANT ALL ON TABLE "public"."community_members" TO "authenticated";
GRANT ALL ON TABLE "public"."community_members" TO "service_role";



GRANT ALL ON TABLE "public"."community_reports" TO "anon";
GRANT ALL ON TABLE "public"."community_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."community_reports" TO "service_role";



GRANT ALL ON SEQUENCE "public"."community_reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."community_reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."community_reports_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."community_topics" TO "anon";
GRANT ALL ON TABLE "public"."community_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."community_topics" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."coupons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."coupons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."coupons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expert_request_proposals" TO "anon";
GRANT ALL ON TABLE "public"."expert_request_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_request_proposals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expert_request_proposals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expert_request_proposals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expert_request_proposals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expert_request_reviews" TO "anon";
GRANT ALL ON TABLE "public"."expert_request_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_request_reviews" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expert_request_reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expert_request_reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expert_request_reviews_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expert_requests" TO "anon";
GRANT ALL ON TABLE "public"."expert_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_requests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expert_requests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expert_requests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expert_requests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."moon_charges" TO "anon";
GRANT ALL ON TABLE "public"."moon_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."moon_charges" TO "service_role";



GRANT ALL ON SEQUENCE "public"."moon_charges_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."moon_charges_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."moon_charges_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."moon_point_transactions" TO "anon";
GRANT ALL ON TABLE "public"."moon_point_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."moon_point_transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."moon_point_transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."moon_point_transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."moon_point_transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."moon_withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."moon_withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."moon_withdrawals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."moon_withdrawals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."moon_withdrawals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."moon_withdrawals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_options" TO "anon";
GRANT ALL ON TABLE "public"."order_options" TO "authenticated";
GRANT ALL ON TABLE "public"."order_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_options_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payment_transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payment_transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payment_transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."post_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."post_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."post_bookmarks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_bookmarks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_bookmarks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_bookmarks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_comment_votes" TO "anon";
GRANT ALL ON TABLE "public"."post_comment_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comment_votes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_comment_votes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_comment_votes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_comment_votes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_comments" TO "anon";
GRANT ALL ON TABLE "public"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_reports" TO "anon";
GRANT ALL ON TABLE "public"."post_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."post_reports" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_reports_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_votes" TO "anon";
GRANT ALL ON TABLE "public"."post_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_votes" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_attachments" TO "anon";
GRANT ALL ON TABLE "public"."proposal_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_attachments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."proposal_attachments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."proposal_attachments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."proposal_attachments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."seller_settlements" TO "anon";
GRANT ALL ON TABLE "public"."seller_settlements" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_settlements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."seller_settlements_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."seller_settlements_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."seller_settlements_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."service_likes" TO "anon";
GRANT ALL ON TABLE "public"."service_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."service_likes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."service_likes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."service_likes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."service_likes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."service_options" TO "anon";
GRANT ALL ON TABLE "public"."service_options" TO "authenticated";
GRANT ALL ON TABLE "public"."service_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."service_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."service_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."service_options_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."service_orders" TO "anon";
GRANT ALL ON TABLE "public"."service_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."service_orders" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."service_order_stats" TO "anon";
GRANT ALL ON TABLE "public"."service_order_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."service_order_stats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."service_orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."service_orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."service_orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."service_reviews" TO "anon";
GRANT ALL ON TABLE "public"."service_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."service_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."service_review_stats" TO "anon";
GRANT ALL ON TABLE "public"."service_review_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."service_review_stats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."service_reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."service_reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."service_reviews_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."settlement_orders" TO "anon";
GRANT ALL ON TABLE "public"."settlement_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."settlement_orders" TO "service_role";



GRANT ALL ON TABLE "public"."topic_categories" TO "anon";
GRANT ALL ON TABLE "public"."topic_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."topic_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."topic_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."topic_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."topic_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."topics" TO "anon";
GRANT ALL ON TABLE "public"."topics" TO "authenticated";
GRANT ALL ON TABLE "public"."topics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."topics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."topics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."topics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."user_bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_bank_accounts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_bank_accounts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_bank_accounts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_bank_accounts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_charge_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_charge_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_charge_stats" TO "service_role";



GRANT ALL ON TABLE "public"."user_coupons" TO "anon";
GRANT ALL ON TABLE "public"."user_coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."user_coupons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_coupons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_coupons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_coupons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_devices" TO "anon";
GRANT ALL ON TABLE "public"."user_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."user_devices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_devices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_devices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_devices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_follows" TO "anon";
GRANT ALL ON TABLE "public"."user_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follows" TO "service_role";



GRANT ALL ON TABLE "public"."user_reports" TO "anon";
GRANT ALL ON TABLE "public"."user_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reports" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_reports_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























