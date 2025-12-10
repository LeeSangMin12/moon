### 1. 개발 DB(moon-local)에서 테이블 수정

Supabase 대시보드에서 자유롭게 수정

### 2. 마이그레이션 파일 생성

```bash
npx supabase db diff -f 변경내용_설명
```

### 3. 운영 DB에 적용

```bash
npx supabase link --project-ref xgnnhfmpporixibxpeas
npx supabase db push
npx supabase link --project-ref uqaiqevdmwlpsozwnigg
```

## 프로젝트 ID

- **개발**: `uqaiqevdmwlpsozwnigg`
- **운영**: `xgnnhfmpporixibxpeas`
