# 포트원 결제 시스템 구축 결과 보고서

**작성일**: 2025년 11월 14일
**프로젝트명**: Moon 플랫폼 결제 시스템 구축
**개발 기간**: [시작일] ~ [종료일]
**담당자**: [이름]

---

## 📌 프로젝트 개요

### 목적
Moon 플랫폼에 포트원(PortOne) 기반의 카드 결제 시스템을 구축하여 사용자가 안전하고 편리하게 결제할 수 있는 환경을 제공

### 범위
- PG사 연동 (토스페이먼츠)
- 카드 결제 기능 구현
- 결제 취소/환불 기능
- 결제 내역 조회 및 관리
- 보안 검증 (위·변조 방지)

---

## 🎯 실행 항목별 검증 결과

### 1. PG사 연동 및 결제 환경 세팅 (800,000원)

#### 상세 내용
- 결제대행사(PG) 계정 연동
- API Key 발급 및 초기 연동 테스트

#### 검증 결과

| 항목 | 내용 | 상태 |
|------|------|------|
| PG사 선정 | 토스페이먼츠 (포트원 V1 API 사용) | ✅ 완료 |
| 계정 생성 | 포트원 계정 생성 및 인증 | ✅ 완료 |
| 가맹점 식별코드 | `imp66011865` 발급 | ✅ 완료 |
| REST API Key | 발급 및 환경 변수 설정 | ✅ 완료 |
| 테스트 모드 | 토스페이먼츠 테스트 채널 설정 | ✅ 완료 |
| SDK 연동 | 포트원 JavaScript SDK 통합 | ✅ 완료 |

#### 증빙 자료

**스크린샷**:
- [ ] `환경설정_1_포트원계정.png` - 포트원 관리자 페이지
- [ ] `환경설정_2_API키.png` - API Key 화면
- [ ] `환경설정_3_PG설정.png` - 토스페이먼츠 채널 설정

**설정 파일**:
```javascript
// src/routes/(main)/payment/+page.svelte (42번째 줄)
IMP.init('imp66011865'); // 가맹점 식별코드

// PG 설정 (82번째 줄)
pg: 'tosspayments.iamporttest_3', // 토스페이먼츠 테스트
```

#### 단가: 800,000원

---

### 2. 결제 API 적용 및 화면 연동 (600,000원)

#### 상세 내용
- 웹 결제 화면과 결제 API 통신 구현
- 결제 완료 시 처리 로직 완성

#### 검증 결과

| 항목 | 내용 | 상태 |
|------|------|------|
| 결제 UI 구현 | `/payment` 페이지 제작 | ✅ 완료 |
| 결제 요청 | 포트원 SDK 연동 | ✅ 완료 |
| 결제 완료 처리 | DB 저장, 통계 업데이트 | ✅ 완료 |
| 결제 실패 처리 | 에러 메시지, 상태 관리 | ✅ 완료 |
| 결제 내역 조회 | 사용자별 거래 목록 표시 | ✅ 완료 |
| 상태별 필터 | 전체/대기/완료/취소/환불 | ✅ 완료 |
| 통계 대시보드 | 총 거래, 완료, 취소, 총 금액 | ✅ 완료 |

#### 테스트 결과

**정상 결제 테스트**:
- 테스트 금액: 1,000원, 5,000원, 10,000원, 50,000원
- 결과: ⬜ 모두 성공 / ⬜ 일부 실패

**결제 실패 테스트**:
- 시나리오: 잘못된 카드 정보 입력, 결제창 취소
- 결과: ⬜ 정상 처리 / ⬜ 비정상

**금액 범위 검증**:
- 최소 금액(100원): ⬜ 통과 / ⬜ 실패
- 최대 금액(10,000,000원): ⬜ 통과 / ⬜ 실패
- 범위 초과 에러: ⬜ 통과 / ⬜ 실패

#### 증빙 자료

**스크린샷**:
- [ ] `결제_1_결제창.png` - 포트원 결제창
- [ ] `결제_2_완료.png` - 결제 완료 화면
- [ ] `결제_3_거래내역.png` - 거래 내역 테이블
- [ ] `결제_4_다중거래.png` - 여러 건의 거래
- [ ] `통계_1_최종.png` - 통계 대시보드

**구현 파일**:
- `src/routes/(main)/payment/+page.svelte` - 클라이언트 UI
- `src/routes/(main)/payment/+page.server.js` - 서버 로드
- `src/lib/supabase/payments.js` - 결제 API 모듈
- Database: `payment_transactions` 테이블

#### 수량: 1회

#### 단가: 600,000원

---

### 3. 보안 검증 및 안전성 검점 (600,000원)

#### 상세 내용
- 결제 오류 케이스 점검
- 위·변조 전파 방지 설정 작성
- 결제 리포트 작성

#### 검증 결과

| 항목 | 내용 | 상태 |
|------|------|------|
| 금액 검증 | 웹훅에서 포트원 API 호출 및 실제 금액 비교 | ✅ 완료 |
| 중복 결제 방지 | merchant_uid 고유성 검증 | ✅ 완료 |
| 로그인 체크 | 비인증 사용자 결제 차단 | ✅ 완료 |
| 결제 취소 보안 | 서버 API를 통한 취소만 허용 | ✅ 완료 |
| 에러 로깅 | 콘솔 로그 및 에러 추적 | ✅ 완료 |
| 환경 변수 보호 | API Key는 서버 사이드만 접근 | ✅ 완료 |

#### 보안 테스트 결과

**금액 위·변조 테스트**:
- 시나리오: 클라이언트에서 금액 변조 시도
- 웹훅 검증: ⬜ 차단 성공 / ⬜ 차단 실패
- 에러 로그: ⬜ 기록됨 / ⬜ 기록 안 됨

**결제 취소 보안**:
- 클라이언트 직접 DB 업데이트: ⬜ 차단됨 / ⬜ 가능함
- 서버 API 필수 호출: ⬜ 강제됨 / ⬜ 우회 가능

**로그인 체크**:
- 비로그인 상태 접근: ⬜ 리다이렉트됨 / ⬜ 접근 가능

#### 오류 케이스 처리 현황

| 오류 케이스 | 처리 방법 | 검증 결과 |
|------------|----------|----------|
| 네트워크 오류 | 에러 메시지 표시 | ⬜ 통과 / ⬜ 실패 |
| 결제 타임아웃 | 취소 처리 | ⬜ 통과 / ⬜ 실패 |
| 중복 요청 | merchant_uid 중복 체크 | ⬜ 통과 / ⬜ 실패 |
| 금액 불일치 | 웹훅에서 차단 | ⬜ 통과 / ⬜ 실패 |
| 인증 실패 | 로그인 페이지 리다이렉트 | ⬜ 통과 / ⬜ 실패 |

#### 증빙 자료

**스크린샷**:
- [ ] `보안_1_금액검증.png` - 금액 검증 로그
- [ ] `보안_2_로그인체크.png` - 로그인 리다이렉트
- [ ] `웹훅_1_로그.png` - 웹훅 수신 로그

**구현 파일**:
- `src/routes/api/portone/webhook/+server.js` - 웹훅 금액 검증
- `src/routes/api/portone/cancel/+server.js` - 서버 사이드 취소 API
- `src/routes/(main)/payment/+page.server.js` - 로그인 체크

**보안 설정**:
```javascript
// 환경 변수 보호
const PORTONE_API_KEY = process.env.PORTONE_REST_API_KEY;
const PORTONE_API_SECRET = process.env.PORTONE_REST_API_SECRET;

// 금액 검증
if (payment_data.amount !== transaction.amount) {
    error(400, 'Amount mismatch - possible fraud attempt');
}

// 로그인 체크
if (!auth_user?.id) {
    redirect(302, '/login');
}
```

#### 수량: 1회

#### 단가: 600,000원

---

## 📊 최종 통계

### 테스트 결제 데이터

| 항목 | 수량 | 금액 |
|------|------|------|
| 총 거래 건수 | [N]건 | - |
| 완료 건수 | [N]건 | [N]원 |
| 취소 건수 | [N]건 | [N]원 |
| 실패 건수 | [N]건 | - |
| **총 결제 금액** | - | **[N]원** |

### 데이터베이스 현황

```sql
-- payment_transactions 테이블 통계
SELECT
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount
FROM payment_transactions;
```

**결과**:
```
total_count: [N]
completed_count: [N]
cancelled_count: [N]
total_amount: [N]원
```

---

## 💰 예산 집행 내역

| No. | 항목 | 단가(원) | 수량 | 공급가(액)(원) |
|-----|------|----------|------|----------------|
| 1 | PG사 연동 및 결제 환경 세팅<br>- 결제대행사(PG) 계정 연동<br>- API Key 발급 및 초기 연동 테스트 | 800,000 | 1 | 800,000 |
| 2 | 결제 API 적용 및 화면 연동<br>- 웹 결제 화면과 결제 API 통신 구현<br>- 결제 완료 시 처리 로직 완성 | 600,000 | 1 | 600,000 |
| 3 | 보안 검증 및 안전성 검점<br>- 결제 오류 케이스 점검<br>- 위·변조 전파 방지 설정 작성<br>- 결제 리포트 작성 | 600,000 | 1 | 600,000 |
| **합계** | | | | **2,000,000원** |

(VAT 별도)

---

## 📁 산출물

### 1. 소스 코드

#### 클라이언트
- `src/routes/(main)/payment/+page.svelte` - 결제 페이지 UI
- `src/routes/(main)/payment/+page.server.js` - 서버 로드 함수

#### 서버 API
- `src/routes/api/portone/webhook/+server.js` - 웹훅 핸들러
- `src/routes/api/portone/cancel/+server.js` - 결제 취소 API

#### 데이터 레이어
- `src/lib/supabase/payments.js` - 결제 API 모듈
- `src/lib/supabase/api.js` - API 통합
- Migration: `payment_transactions` 테이블

### 2. 문서

- `PAYMENT.md` - 포트원 설정 가이드
- `PAYMENT_TEST.md` - 테스트 시나리오 (10개 시나리오)
- `PAYMENT_REPORT.md` - 본 결과 보고서

### 3. 데이터베이스

#### 테이블: `payment_transactions`

**컬럼 구조**:
- `id`: 거래 ID (Primary Key)
- `user_id`: 사용자 ID
- `merchant_uid`: 가맹점 주문번호 (Unique)
- `imp_uid`: 포트원 거래번호
- `amount`: 결제 금액
- `status`: 거래 상태 (pending, completed, cancelled, refunded)
- `payment_method`: 결제 수단
- `pg_provider`: PG사
- `pg_tid`: PG사 거래번호
- `card_name`: 카드사
- `card_number`: 마스킹된 카드번호
- `receipt_url`: 영수증 URL
- `cancel_reason`: 취소 사유
- `cancelled_at`: 취소 일시
- `created_at`, `updated_at`: 생성/수정 일시

**인덱스**:
- `payment_transactions_user_id_idx`
- `payment_transactions_status_idx`
- `payment_transactions_merchant_uid_idx`
- `payment_transactions_created_at_idx`

---

## 🎨 스크린샷 첨부

### 환경 설정
1. [ ] `환경설정_1_포트원계정.png`
2. [ ] `환경설정_2_API키.png`
3. [ ] `환경설정_3_PG설정.png`

### 결제 기능
4. [ ] `결제_1_결제창.png`
5. [ ] `결제_2_완료.png`
6. [ ] `결제_3_거래내역.png`
7. [ ] `결제_4_다중거래.png`

### 결제 취소
8. [ ] `취소_1_확인창.png`
9. [ ] `취소_2_완료.png`

### 오류 처리
10. [ ] `실패_1_에러메시지.png`
11. [ ] `검증_1_금액범위.png`

### 필터링
12. [ ] `필터_1_완료.png`
13. [ ] `필터_2_취소.png`

### 보안
14. [ ] `보안_1_금액검증.png`
15. [ ] `보안_2_로그인체크.png`
16. [ ] `웹훅_1_로그.png`

### 통계
17. [ ] `통계_1_최종.png`

---

## ✅ 완료 항목 체크리스트

- [ ] PG사 연동 완료
- [ ] API Key 발급 완료
- [ ] 결제 UI 구현 완료
- [ ] 결제 API 연동 완료
- [ ] 결제 취소 기능 완료
- [ ] 결제 내역 조회 완료
- [ ] 금액 검증 완료
- [ ] 웹훅 처리 완료
- [ ] 보안 검증 완료
- [ ] 테스트 시나리오 작성 완료
- [ ] 모든 테스트 실행 완료
- [ ] 스크린샷 캡처 완료
- [ ] 결과 보고서 작성 완료

---

## 🔧 기술 스택

- **Frontend**: SvelteKit 2, Svelte 5, TailwindCSS
- **Backend**: SvelteKit API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Payment**: 포트원 (PortOne) V1 API
- **PG사**: 토스페이먼츠 (Toss Payments)

---

## 📝 특이사항 및 비고

### 구현 완료 사항
1. 카드 결제 (토스페이먼츠)
2. 결제 취소/환불 (서버 API)
3. 금액 위·변조 방지 (웹훅 검증)
4. 결제 내역 관리
5. 통계 대시보드

### 미구현 사항 (향후 확장 가능)
1. 간편결제 (카카오페이, 네이버페이 등)
2. 계좌이체
3. 가상계좌
4. 정기결제 (subscription)
5. 관리자 페이지 (전체 거래 조회)

### 알려진 제한사항
1. 테스트 모드: 실제 결제는 이루어지지 않음
2. 로컬 웹훅: ngrok 등 터널링 도구 필요
3. 환경 변수: 배포 시 설정 필요

---

## 📞 문의사항

결제 시스템 관련 문의:
- 포트원 고객센터: 1670-0524
- 포트원 문서: https://portone.gitbook.io/docs/

---

**보고서 작성자**: [이름]
**작성일**: 2025년 11월 14일
**승인자**: [담당자 이름]
**승인일**: [날짜]

---

## 📎 첨부 파일 목록

1. 스크린샷 (17장)
2. 소스 코드 (압축 파일)
3. 데이터베이스 스키마 (SQL 파일)
4. 테스트 시나리오 문서 (PAYMENT_TEST.md)
5. 설정 가이드 (PAYMENT.md)
