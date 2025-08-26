# 전문가 요청 시스템 테이블 설정 가이드

## 개요
`/service` 페이지의 "전문가 찾기" 기능을 위해 필요한 데이터베이스 테이블을 생성합니다.

## 설정 단계

### 1. Supabase Dashboard 접속
1. https://supabase.com 에서 프로젝트 대시보드에 로그인
2. 좌측 메뉴에서 "SQL Editor" 선택

### 2. 테이블 생성
`create_expert_tables.sql` 파일의 내용을 SQL Editor에 복사하여 실행합니다.

생성되는 테이블:
- **expert_requests**: 전문가 요청 정보
- **expert_request_proposals**: 전문가 제안 정보

### 3. 테스트 데이터 추가 (선택사항)
`insert_expert_test_data.sql` 파일의 내용을 SQL Editor에 복사하여 실행합니다.

추가되는 데이터:
- 7개의 샘플 전문가 요청
- 9개의 샘플 전문가 제안

## 테이블 구조

### expert_requests
```sql
- id: 요청 ID (Primary Key)
- title: 요청 제목
- category: 카테고리 (웹개발, 디자인, 마케팅 등)
- description: 상세 설명
- budget_min/budget_max: 예산 범위
- deadline: 완료 희망일
- requester_id: 요청자 ID (users 테이블 참조)
- status: 상태 (open, in_progress, completed, cancelled)
- created_at/updated_at/deleted_at: 타임스탬프
```

### expert_request_proposals
```sql
- id: 제안 ID (Primary Key)  
- request_id: 요청 ID (expert_requests 테이블 참조)
- expert_id: 전문가 ID (users 테이블 참조)
- message: 제안 메시지
- proposed_budget: 제안 예산
- proposed_timeline: 제안 일정
- status: 상태 (pending, accepted, rejected)
- created_at/updated_at: 타임스탬프
```

## 권한 설정 (RLS)
테이블에는 Row Level Security가 적용되어 있어 다음과 같은 권한이 설정됩니다:

- **읽기**: 모든 사용자가 전문가 요청과 제안을 볼 수 있음
- **생성**: 로그인한 사용자만 요청/제안 생성 가능
- **수정/삭제**: 작성자만 자신의 요청/제안을 수정/삭제 가능

## 확인 방법
테이블 생성 후 다음 쿼리로 확인할 수 있습니다:

```sql
-- 테이블 존재 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('expert_requests', 'expert_request_proposals');

-- 데이터 확인
SELECT COUNT(*) as expert_requests_count FROM expert_requests;
SELECT COUNT(*) as proposals_count FROM expert_request_proposals;
```

## 주의사항
- 테이블 생성 전에 `users` 테이블이 존재해야 합니다 (외래키 제약조건)
- RLS 정책으로 인해 인증되지 않은 사용자는 데이터를 생성/수정할 수 없습니다
- 테스트 데이터의 사용자 ID는 실제 존재하는 사용자 ID와 매치되어야 합니다