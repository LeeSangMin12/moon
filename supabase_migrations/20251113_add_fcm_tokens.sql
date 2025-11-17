-- ============================================
-- FCM 토큰 및 푸시 알림 설정 마이그레이션
-- 생성일: 2025-11-13
-- 설명: 푸시 알림을 위한 FCM 토큰 저장 및 알림 설정 테이블
-- ============================================

-- 1. FCM 토큰 저장 테이블 (멀티 디바이스 지원)
CREATE TABLE IF NOT EXISTS user_devices (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL UNIQUE,
  device_type TEXT CHECK (device_type IN ('android', 'ios', 'web')),
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fcm_token ON user_devices(fcm_token);

COMMENT ON TABLE user_devices IS '사용자 디바이스 FCM 토큰 저장 (푸시 알림용)';
COMMENT ON COLUMN user_devices.fcm_token IS 'Firebase Cloud Messaging 토큰';
COMMENT ON COLUMN user_devices.device_type IS '디바이스 타입: android, ios, web';
COMMENT ON COLUMN user_devices.device_name IS '디바이스 이름 (예: Samsung Galaxy S21, iPhone 13)';

-- 2. 알림 설정 테이블 (사용자별 알림 on/off)
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  post_liked BOOLEAN DEFAULT true,
  comment_created BOOLEAN DEFAULT true,
  comment_reply BOOLEAN DEFAULT true,
  follow_created BOOLEAN DEFAULT true,
  order_created BOOLEAN DEFAULT true,
  order_approved BOOLEAN DEFAULT true,
  order_completed BOOLEAN DEFAULT true,
  review_created BOOLEAN DEFAULT true,
  expert_review_created BOOLEAN DEFAULT true,
  proposal_accepted BOOLEAN DEFAULT true,
  gift_received BOOLEAN DEFAULT true,
  coffee_chat_requested BOOLEAN DEFAULT true,
  coffee_chat_accepted BOOLEAN DEFAULT true,
  coffee_chat_rejected BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE notification_settings IS '사용자별 알림 설정 (푸시 알림 on/off)';
COMMENT ON COLUMN notification_settings.push_enabled IS '푸시 알림 전체 활성화 여부';

-- 3. 사용자 회원가입 시 자동으로 알림 설정 생성하는 함수
CREATE OR REPLACE FUNCTION create_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 생성 (이미 존재하면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_notification_settings'
  ) THEN
    CREATE TRIGGER trigger_create_notification_settings
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_settings();
  END IF;
END $$;

-- 5. 기존 사용자들을 위한 알림 설정 생성
INSERT INTO notification_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_settings)
ON CONFLICT (user_id) DO NOTHING;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ FCM 토큰 및 알림 설정 테이블 생성 완료';
  RAISE NOTICE '📊 user_devices 테이블: FCM 토큰 저장';
  RAISE NOTICE '⚙️ notification_settings 테이블: 알림 설정';
END $$;
