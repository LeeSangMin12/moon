# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

SvelteKit 2 + Svelte 5로 구축된 소셜 플랫폼. Supabase(인증/DB), Vercel 배포.
주요 기능: 게시물, 서비스, 커뮤니티, 전문가 요청, TipTap 리치 텍스트 편집.

## Svelte 5 Runes (필수)

```javascript
// State
let count = $state(0);
let user = $state({ name: 'John' });

// Derived
let doubled = $derived(count * 2);
let fullName = $derived.by(() => `${user.firstName} ${user.lastName}`);

// Effects
$effect(() => {
  console.log('Count changed:', count);
});

// Props (export let 대신)
let { propName, optional = 'default' } = $props();

// Bindable props
let { bindableProp = $bindable('fallback') } = $props();

// 이벤트 핸들러 (on:click 대신)
<button onclick={() => count++}>클릭</button>

// Snippets (slots 대신)
{#snippet figure(image)}
  <figure><img src={image.src} alt={image.caption} /></figure>
{/snippet}
{@render figure(myImage)}
```

## SvelteKit 2 패턴 (필수)

```javascript
// error/redirect는 throw 없이 호출
import { error, redirect } from '@sveltejs/kit';
error(404, 'Not found');  // throw 하지 않음
redirect(303, '/login');

// 쿠키는 path 필수
cookies.set(name, value, { path: '/' });

// Load 함수는 병렬 처리
export async function load({ fetch }) {
  const [a, b] = await Promise.all([
    fetch('/api/a').then(r => r.json()),
    fetch('/api/b').then(r => r.json())
  ]);
  return { a, b };
}

// 외부 URL은 window.location 사용
window.location.href = 'https://external.com';  // goto() 아님
```

## ❌ 절대 금지 사항

1. **컴포넌트에서 Supabase 직접 호출 금지** - 항상 `src/lib/supabase/` API 모듈 사용
2. **Svelte 4 문법 금지** - `export let`, `$:`, `on:click` 사용 안 됨
3. **쿠키 설정 시 path 생략 금지**
4. **외부 URL에 `goto()` 사용 금지**
5. **error/redirect에 `throw` 사용 금지**
6. **Load 함수에서 순차 await 금지** - `Promise.all()` 사용

## 아키텍처 핵심

### API 레이어 패턴 (중요!)

**모든 DB 쿼리는 `src/lib/supabase/` 모듈을 통해서만 실행**

```javascript
// ✅ 올바른 방법
import { get_api_context } from '$lib/contexts/app_context.svelte.js';

const api = get_api_context();
const posts = await api.posts.select_infinite_scroll(last_id, community_id, 10);
const user = await api.users.select_by_id(user_id);
const url = await api.post_images.upload(file, `${user_id}/${Date.now()}.jpg`);

// ❌ 절대 금지
const { data } = await supabase.from('posts').select('*');  // 컴포넌트에서 직접 호출 금지
```

**API 모듈 구조**:
- `src/lib/supabase/posts.js`, `users.js`, `communities.js` 등
- 각 모듈: `create_[entity]_api(supabase)` 팩토리 패턴
- Storage: `bucket/users/avatars.js`, `bucket/posts/images.js`

### 상태 관리

```javascript
// 1. Context - 사용자 및 API (주요 방법)
import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';
const me = get_user_context();  // 현재 사용자 (반응형 객체)
const api = get_api_context();  // Supabase API (반응형 객체)

// 사용자 정보 업데이트
Object.assign(me, { name: '새이름' });

// 2. Global Store - 전역 UI 상태
import { is_login_prompt_modal, loading } from '$lib/store/global_store.js';

// 3. 로컬 상태 - $state() 사용
let posts = $state([]);
```

### 인증 체크

```javascript
// 클라이언트: 보호된 작업 전 체크
import { get_user_context } from '$lib/contexts/app_context.svelte.js';
import { is_login_prompt_modal } from '$lib/store/global_store.js';

const me = get_user_context();

function handle_protected_action() {
  if (!me.id) {
    $is_login_prompt_modal = true;
    return;
  }
  // 작업 수행
}

// 서버: load 함수에서 체크
export async function load({ locals }) {
  const user = await locals.get_user();
  if (!user) redirect(303, '/login');
  // ...
}
```

### 서버 로딩 패턴

```javascript
// +page.server.js
import { create_api } from '$lib/supabase/api.js';

export async function load({ locals, params }) {
  const user = await locals.get_user();
  const api = create_api(locals.supabase);

  // 병렬 쿼리
  const [posts, communities] = await Promise.all([
    api.posts.select_by_user_id(params.user_id),
    api.communities.select_all()
  ]);

  return { posts, communities };
}
```

### Composables 패턴

```javascript
// src/lib/composables/use_post_handlers.svelte.js
import { create_post_handlers } from '$lib/composables/use_post_handlers.svelte.js';

const { handle_vote_changed, handle_bookmark_changed } = create_post_handlers(
  () => posts,          // getter
  (val) => posts = val, // setter
  me                    // 현재 사용자
);
```

### 무한 스크롤

```javascript
import { useInfiniteScroll } from '$lib/composables/useInfiniteScroll.svelte.js';

const { initializeLastId, setupObserver } = useInfiniteScroll(
  () => posts,
  (val) => posts = val,
  async (lastId) => await api.posts.select_infinite_scroll(lastId, community_id, 10)
);

$effect(() => {
  initializeLastId(data.posts);
  const cleanup = setupObserver(loading_trigger_element);
  return cleanup;
});
```

## 네이밍 컨벤션

**snake_case 중심** (Supabase DB와 일관성)

```javascript
// 파일명
Post.svelte                    // 컴포넌트 (PascalCase)
app_context.svelte.js          // 유틸/API 모듈 (snake_case)
sign-up/                       // 라우트 폴더 (kebab-case)

// 변수/함수
let user_id = $state('');
function get_user_data() { }
const handle_click = () => { };
const MAX_FILE_SIZE = 5000000; // 상수 (UPPER_SNAKE_CASE)

// Props
let { user_id, is_active = false } = $props();

// API 메서드
api.posts.select_by_id(id)
api.posts.select_infinite_scroll(last_id, limit)
api.posts.insert_new_post(data)

// 이벤트 핸들러
const handle_vote_changed = () => { };
const handle_bookmark_changed = () => { };

// Composables (예외: export 함수는 camelCase)
// use_post_handlers.svelte.js
export function create_post_handlers(get_posts, set_posts, me) {
  return { handle_vote_changed, handle_bookmark_changed };
}

// DB
posts                          // 테이블 (snake_case 복수형)
user_id, created_at           // 컬럼 (snake_case)

// CSS
.user-profile-card            // 커스텀 클래스 (kebab-case)
```

## 에러 처리

```javascript
// 서버
import { error } from '@sveltejs/kit';

export async function load({ locals, params }) {
  try {
    const api = create_api(locals.supabase);
    const post = await api.posts.select_by_id(params.id);
    if (!post) error(404, '게시물을 찾을 수 없습니다');
    return { post };
  } catch (err) {
    console.error('Load error:', err);
    error(500, '데이터를 불러오는 중 오류가 발생했습니다');
  }
}

// 클라이언트
import { show_toast } from '$lib/utils/common.js';

async function handle_submit() {
  try {
    const result = await api.posts.insert_new_post(post_data);
    show_toast('게시물이 작성되었습니다', 'success');
    goto(`/posts/${result.id}`);
  } catch (err) {
    console.error('Submit error:', err);
    show_toast('게시물 작성에 실패했습니다', 'error');
  }
}
```

## 보안 참고

- **RLS 사용 안 함**: 서버 사이드 인증 체크로 처리
- **인증 체크**: 보호된 라우트/API에서 `locals.get_user()` 또는 `me.id` 확인
- **파일 업로드**: 타입/크기 검증 필수
- **환경 변수**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트 노출 금지

## 유틸리티

```javascript
import {
  comma,              // 숫자 포맷: 1000 → "1,000"
  format_date,        // 날짜 포맷: Date → "25.01.15"
  show_toast,         // 토스트 알림
  check_login,        // 로그인 확인
  copy_to_clipboard   // 클립보드 복사
} from '$lib/utils/common.js';
```
