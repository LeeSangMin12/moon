# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

SvelteKit 2와 Svelte 5로 구축된 소셜 플랫폼입니다. 게시물, 서비스, 커뮤니티, 전문가 요청, 리치 텍스트 편집 기능을 제공합니다. 인증 및 데이터베이스는 Supabase를 사용하며, Vercel에 배포됩니다.

## 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 빌드 미리보기
npm run preview

# 모든 테스트 실행
npm run test

# 테스트를 watch 모드로 실행
npm run test:unit

# 코드 린트
npm run lint

# 코드 포맷팅
npm run format
```

## 테스트

Vitest를 별도의 워크스페이스로 사용합니다:
- **클라이언트 테스트**: `*.svelte.{test,spec}.{js,ts}` - jsdom 환경에서 @testing-library/svelte로 실행
- **서버 테스트**: `*.{test,spec}.{js,ts}` (.svelte 제외) - Node 환경에서 실행

테스트 파일은 테스트하는 코드와 같은 위치에 배치해야 합니다.

## Svelte 5 Runes (중요)

이 프로젝트는 Svelte 5의 runes를 사용합니다. 항상 새로운 문법을 사용하세요:

```javascript
// State (상태)
let count = $state(0);
let user = $state({ name: 'John' });

// Derived state (파생 상태)
let doubled = $derived(count * 2);
let fullName = $derived.by(() => `${user.firstName} ${user.lastName}`);

// Effects (값이 변경될 때 부수 효과)
$effect(() => {
  console.log('Count changed:', count);
});

// Props (export let을 대체)
let { propName, optional = 'default' } = $props();

// Bindable props (bind:를 대체)
let { bindableProp = $bindable('fallback') } = $props();
```

**이벤트 핸들러**는 속성입니다 (`on:` 지시자가 아님):
```javascript
<button onclick={() => count++}>클릭</button>
<button {onclick}>클릭</button>  // 축약형
```

**Snippets**가 slots를 대체합니다:
```javascript
{#snippet figure(image)}
  <figure>
    <img src={image.src} alt={image.caption} />
  </figure>
{/snippet}

{@render figure(myImage)}
```

## SvelteKit 2 패턴 (중요)

**에러와 리다이렉트**: throw하지 말고 그냥 호출:
```javascript
import { error, redirect } from '@sveltejs/kit';

// SvelteKit 2 - 그냥 호출
error(500, 'something went wrong');
redirect(303, '/login');
```

**쿠키는 path가 필수**:
```javascript
cookies.set(name, value, { path: '/' });
```

**Load 함수는 promise를 await 해야 함**:
```javascript
// 좋은 예 - 병렬 로딩
export async function load({ fetch }) {
  const [a, b] = await Promise.all([
    fetch('/api/a').then(r => r.json()),
    fetch('/api/b').then(r => r.json())
  ]);
  return { a, b };
}
```

**외부 네비게이션**: 외부 URL은 `goto()` 대신 `window.location.href` 사용.

## 아키텍처 개요

### 상태 관리 (하이브리드 방식)

1. **Svelte Context** (`src/lib/contexts/app-context.svelte.js`): 사용자 및 API 컨텍스트
   ```javascript
   import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';

   const { me } = get_user_context();  // 현재 사용자 (반응형)
   const { api } = get_api_context();  // Supabase API 인스턴스
   ```

2. **Svelte Stores** (`src/lib/store/global_store.js`): 전역 UI 상태
   ```javascript
   import { is_login_prompt_modal, loading } from '$lib/store/global_store.js';
   ```

3. **로컬 컴포넌트 상태**: 컴포넌트 범위의 반응형 변수에는 `$state()` 사용

### Supabase API 레이어

모든 데이터베이스 쿼리는 `src/lib/supabase/`의 중앙화된 API 모듈을 통해 실행됩니다:

```javascript
// 컴포넌트나 라우트에서
const { api } = get_api_context();

// 게시물 쿼리
const posts = await api.posts.select_infinite_scroll(last_id, community_id, 10);

// 사용자 쿼리
const user = await api.users.select_by_id(user_id);

// 이미지 업로드
const url = await api.post_images.upload(image_file, `${user_id}/${Date.now()}.jpg`);
```

**API 모듈** (`src/lib/supabase/` 내):
- `posts.js`, `users.js`, `services.js`, `communities.js`, `expert_requests.js` 등
- Storage: `bucket/users/avatars.js`, `bucket/posts/images.js` 등
- 모두 팩토리 패턴을 통해 `api.js`에서 결합됨

**각 모듈 export**: `create_[entity]_api(supabase)`를 반환하며 쿼리 메서드를 포함한 객체를 반환합니다.

### 인증 플로우

1. **서버 훅** (`src/hooks.server.js`):
   - 쿠키를 사용하여 Supabase SSR 클라이언트 생성
   - `event.locals.supabase`와 `event.locals.get_user()` 제공

2. **루트 레이아웃** (`src/routes/+layout.svelte`):
   - `supabase.auth.onAuthStateChange` 리스닝
   - 세션 변경 시 `supabase:auth` 무효화

3. **보호된 작업**: 작업 전에 `me.id`를 확인. 인증되지 않은 경우 로그인 모달 표시:
   ```javascript
   import { is_login_prompt_modal } from '$lib/store/global_store.js';

   if (!me.id) {
     $is_login_prompt_modal = true;
     return;
   }
   ```

### 컴포넌트 패턴

**Composables** (`src/lib/composables/`): 재사용 가능한 로직 훅
```javascript
import { createPostHandlers } from '$lib/composables/usePostHandlers.svelte.js';

const { handle_vote_changed, handle_bookmark_changed } = createPostHandlers(
  () => posts,          // getter
  (val) => posts = val, // setter
  me                    // 현재 사용자
);
```

**TipTap 에디터** (`src/lib/components/tiptap-templates/simple/simple-editor.svelte`):
```javascript
import SimpleEditor from '$lib/components/tiptap-templates/simple/simple-editor.svelte';

let content = $state('');

<SimpleEditor bind:content />
```

확장 기능: StarterKit, Highlight, TextAlign, ImageResize, Typography, Table, Subscript, Superscript

### 라우트 로딩 패턴

서버 사이드 데이터 로딩은 `+page.server.js` 사용:

```javascript
export async function load({ locals, params }) {
  const user = await locals.get_user();
  const supabase = locals.supabase;
  const api = create_api(supabase);

  // 성능을 위한 병렬 쿼리
  const [posts, communities] = await Promise.all([
    api.posts.select_by_user_id(params.user_id),
    api.communities.select_all()
  ]);

  return { posts, communities };
}
```

**캐시 제어**: 데이터가 사용자별인지에 따라 캐시 헤더 설정:
```javascript
setHeaders({
  'cache-control': user?.id ? 'private, must-revalidate' : 'public, max-age=60'
});
```

### 무한 스크롤 패턴

`useInfiniteScroll` composable 사용:

```javascript
import { useInfiniteScroll } from '$lib/composables/useInfiniteScroll.svelte.js';

const { initializeLastId, setupObserver, loadMoreData } = useInfiniteScroll(
  () => posts,
  (val) => posts = val,
  async (lastId) => await api.posts.select_infinite_scroll(lastId, community_id, 10)
);

// 컴포넌트 라이프사이클에서
$effect(() => {
  initializeLastId(data.posts);
  const cleanup = setupObserver(loading_trigger_element);
  return cleanup;
});
```

### 유틸리티 함수

**공통 유틸리티** (`src/lib/utils/common.js`):
```javascript
import {
  comma,              // 숫자 포맷: 1000 → "1,000"
  format_date,        // 날짜 포맷: Date → "25.01.15"
  show_toast,         // 토스트 알림 표시
  check_login,        // 사용자 로그인 확인
  copy_to_clipboard   // 클립보드에 텍스트 복사
} from '$lib/utils/common.js';
```

## 파일 구조

```
src/
├── routes/                    # SvelteKit 파일 기반 라우팅
│   ├── +layout.svelte        # 루트 레이아웃 (인증 리스너)
│   ├── (main)/               # 메인 앱 라우트 그룹
│   │   ├── +layout.svelte    # 메인 레이아웃 (컨텍스트 설정)
│   │   ├── +page.svelte      # 홈 페이지
│   │   ├── @[handle]/        # 사용자 프로필
│   │   ├── service/[id]/     # 서비스 상세
│   │   └── community/[slug]/ # 커뮤니티
│   └── api/                  # API 라우트 (+server.js)
│
├── lib/
│   ├── components/           # UI 컴포넌트
│   │   ├── ui/              # 범용 (Modal, Header 등)
│   │   ├── tiptap-templates/ # 리치 텍스트 에디터
│   │   └── [feature].svelte # 기능별 컴포넌트
│   ├── contexts/            # Svelte 컨텍스트
│   ├── composables/         # 재사용 가능한 로직
│   ├── supabase/            # 데이터베이스 API 레이어
│   │   ├── api.js          # API 팩토리
│   │   ├── [entity].js     # 엔티티 쿼리
│   │   └── bucket/         # 스토리지 API
│   ├── store/              # 전역 스토어
│   ├── utils/              # 유틸리티
│   └── types/              # JSDoc 타입
│
└── hooks.server.js          # 서버 훅 (인증)
```

## 주요 컨벤션

1. **모든 DB 작업**은 `src/lib/supabase/` 모듈을 통해 실행 - 컴포넌트에서 Supabase를 직접 호출하지 않음
2. **반응형 데이터는 컨텍스트 사용** (user, API) - Svelte 5에서는 스토어보다 깔끔함
3. **데이터 페칭은 서버 로드** - 병렬 쿼리를 위해 `Promise.all()` 사용
4. **복잡한 로직은 Composables** - 재사용 가능한 상호작용 패턴 추출
5. **점진적 향상**: 중요한 UI를 먼저 로드하고, `$effect` 또는 `requestIdleCallback`에서 데이터 하이드레이션
6. **전략적 캐싱**: 게시물/커뮤니티의 클라이언트 측 캐싱에 `Map()` 사용
7. **모든 곳에 Svelte 5 runes** - 레거시 `$:` 반응형 문 사용 안 함

## 배포

- **플랫폼**: Vercel
- **어댑터**: `@sveltejs/adapter-vercel`
- **빌드 출력**: 적용 가능한 경우 사전 렌더링을 포함한 SSR
- **환경 변수**: Supabase URL 및 키 (Vercel 대시보드에서 설정)

## 주요 의존성

- **Supabase**: `@supabase/supabase-js` (클라이언트), `@supabase/ssr` (SSR 헬퍼)
- **TipTap**: 확장 기능이 있는 리치 텍스트 에디터
- **DaisyUI**: Tailwind용 컴포넌트 프리셋
- **Tailwind CSS 4**: `@tailwindcss/vite`를 통한 유틸리티 우선 스타일링
- **Svelte 5**: runes가 포함된 최신 버전 (하위 호환 불가)
- **SvelteKit 2**: 최신 컨벤션 (위의 참고 사항 참조)
