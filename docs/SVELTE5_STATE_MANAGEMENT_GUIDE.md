# Svelte 5 상태 관리 가이드

> 이 문서는 프로젝트의 상태 관리를 개선하기 위한 가이드입니다.

## 📚 목차

1. [Svelte 5 Runes 이해하기](#svelte-5-runes-이해하기)
2. [언제 무엇을 사용할까](#언제-무엇을-사용할까)
3. [안티패턴과 해결책](#안티패턴과-해결책)
4. [프로젝트 적용 사례](#프로젝트-적용-사례)

---

## Svelte 5 Runes 이해하기

### `$state` - 반응형 상태 선언

**역할**: 변할 수 있는 기본 상태를 선언합니다.

```javascript
// ✅ 올바른 사용
let count = $state(0);
let user = $state({ name: 'John', age: 30 });

// ❌ 불필요한 사용
const STATIC_VALUE = $state('hello'); // 상수는 그냥 const 사용
```

**특징**:
- 값을 변경하면 UI가 자동으로 갱신
- 객체/배열은 **깊은 반응성** 제공 (Proxy 기반)
- 구조분해 시 반응성 상실 주의

**주의사항**:
```javascript
let todo = $state({ text: '할 일', done: false });

// ❌ 구조분해하면 반응성 사라짐
let { done } = todo;
done = true; // UI 업데이트 안됨!

// ✅ 올바른 방법
todo.done = true; // UI 업데이트됨
```

---

### `$derived` - 파생 상태 (계산된 값)

**역할**: 다른 상태로부터 계산된 값을 선언합니다.

```javascript
let a = $state(2);
let b = $state(3);

// ✅ reactive하게 변하는 계산 값
let sum = $derived(a + b);

// ❌ 불필요한 derived
let staticName = $derived('John Doe'); // 그냥 const 사용
let post_url = $derived(`/post/${post.id}`); // post.id가 안 바뀌면 const
```

**언제 사용할까**:
| 사용하기 ✅ | 사용하지 않기 ❌ |
|------------|----------------|
| `$state`, `$props`, store에 의존 | 상수 값 |
| 자동 업데이트가 필요한 값 | 한 번만 계산하면 되는 값 |
| 복잡한 계산 로직 | 간단한 문자열 조합 |

**예시 비교**:
```javascript
let { post } = $props();
let $user_store = $state({ id: 123 });

// ❌ 불필요한 derived
let author_handle = $derived(post.users?.handle || 'unknown');
let post_url = $derived(`/@${author_handle}/post/${post.id}`);

// ✅ 일반 const (post props는 새 값으로 교체되므로)
const author_handle = post.users?.handle || 'unknown';
const post_url = `/@${author_handle}/post/${post.id}`;

// ✅ 필요한 derived (reactive 값에 의존)
let is_bookmarked = $derived(
  post.post_bookmarks?.some(b => b.user_id === $user_store.id)
);
```

**중요**: `$derived` 내부에서는 **부수효과 금지**!
```javascript
// ❌ 잘못된 사용
let bad = $derived(() => {
  if (a > 5) {
    b += 1; // 상태 변경 금지!
  }
  return a + b;
});

// ✅ 올바른 방법 - effect 사용
$effect(() => {
  if (a > 5) {
    b += 1;
  }
});
```

---

### `$effect` - 부수효과 실행

**역할**: 상태 변화에 따라 외부 동작을 수행합니다.

```javascript
let count = $state(0);

// ✅ 올바른 사용
$effect(() => {
  console.log('count 변경:', count);
  localStorage.setItem('count', count);
});

// ✅ cleanup 함수
$effect(() => {
  const timer = setInterval(() => count++, 1000);
  return () => clearInterval(timer); // cleanup
});
```

**언제 사용할까**:
- console.log
- DOM 조작
- 외부 API 호출
- localStorage/sessionStorage
- 이벤트 리스너 등록

**주의**: SSR 환경에서는 `onMount` 사용 고려
```javascript
import { onMount } from 'svelte';

// ✅ 브라우저에서만 실행
onMount(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
});
```

---

## 언제 무엇을 사용할까

### Decision Tree

```
값이 변하나?
├─ No → const 사용
└─ Yes
    ├─ 다른 reactive 값에 의존하나?
    │   ├─ No → $state
    │   └─ Yes → $derived
    └─ 부수효과가 필요한가?
        └─ Yes → $effect
```

### 실전 예제

#### 1. 간단한 카운터
```javascript
// State
let count = $state(0);

// Derived
let doubled = $derived(count * 2);
let isEven = $derived(count % 2 === 0);

// Effect
$effect(() => {
  document.title = `Count: ${count}`;
});
```

#### 2. 사용자 프로필
```javascript
let { user } = $props(); // 부모로부터 받은 데이터

// ❌ 불필요한 derived
let userName = $derived(user.name);

// ✅ 그냥 사용
<p>{user.name}</p>

// ✅ 필요한 derived (계산 로직 있음)
let fullName = $derived(`${user.firstName} ${user.lastName}`);
let initials = $derived(
  user.firstName[0] + user.lastName[0]
);
```

#### 3. 북마크 기능 (실제 프로젝트)
```javascript
let { post } = $props();
let $user_store = getContext('user');

// ❌ 중복 상태 관리 (안티패턴)
let is_bookmarked = $state(
  post.post_bookmarks?.some(b => b.user_id === $user_store.id)
);

// ✅ Single Source of Truth
let is_bookmarked = $derived(
  post.post_bookmarks?.some(b => b.user_id === $user_store.id)
);

async function toggleBookmark() {
  // post.post_bookmarks 배열만 수정
  if (is_bookmarked) {
    post.post_bookmarks = post.post_bookmarks.filter(
      b => b.user_id !== $user_store.id
    );
  } else {
    post.post_bookmarks = [...post.post_bookmarks, { user_id: $user_store.id }];
  }

  await api.toggle(post.id, $user_store.id);
}
```

---

## 안티패턴과 해결책

### ❌ 안티패턴 1: 불필요한 $derived 남용

```javascript
// ❌ 나쁜 예
let author_handle = $derived(post.users?.handle || 'unknown');
let post_url = $derived(`/@${author_handle}/post/${post.id}`);
let full_url = $derived(`${window.location.origin}${post_url}`);

// ✅ 좋은 예 (props는 새 객체로 교체되므로)
const author_handle = post.users?.handle || 'unknown';
const post_url = `/@${author_handle}/post/${post.id}`;
const full_url = `${window.location.origin}${post_url}`;
```

**판단 기준**: `$props()` 값은 컴포넌트 재생성 시 새 값으로 교체되므로,
단순 계산은 `const`로 충분합니다.

---

### ❌ 안티패턴 2: 중복 상태 관리

```javascript
// ❌ 나쁜 예: 두 개의 상태를 따로 관리
let is_bookmarked = $state(false);
let bookmarks = $state([...]);

function toggle() {
  is_bookmarked = !is_bookmarked; // ⚠️ bookmarks와 불일치 가능
}

// ✅ 좋은 예: Single Source of Truth
let bookmarks = $state([...]);
let is_bookmarked = $derived(
  bookmarks.some(b => b.user_id === currentUserId)
);

function toggle() {
  // bookmarks만 수정
  if (is_bookmarked) {
    bookmarks = bookmarks.filter(b => b.user_id !== currentUserId);
  } else {
    bookmarks = [...bookmarks, { user_id: currentUserId }];
  }
}
```

---

### ❌ 안티패턴 3: derived 내부에서 상태 변경

```javascript
// ❌ 나쁜 예
let a = $state(5);
let b = $state(3);

let bad = $derived(() => {
  if (a > 3) {
    b += 1; // ❌ 금지!
  }
  return a + b;
});

// ✅ 좋은 예
$effect(() => {
  if (a > 3) {
    b += 1; // ✅ effect에서 상태 변경
  }
});

let sum = $derived(a + b); // ✅ derived는 순수 계산만
```

---

### ❌ 안티패턴 4: SvelteKit에서 전역 상태 공유 (서버)

```javascript
// ❌ 서버 파일에서 전역 변수 사용 금지
// src/routes/+page.server.js
let currentUser; // ❌ 여러 사용자가 공유함!

export function load() {
  return { user: currentUser };
}

// ✅ 요청 기반으로 처리
export async function load({ locals, cookies }) {
  const userId = cookies.get('userId');
  const user = await db.getUser(userId);
  return { user };
}
```

---

## 프로젝트 적용 사례

### 1. Store → Runes 마이그레이션

#### Before (Svelte 4 style)
```javascript
// store.js
import { writable } from 'svelte/store';
export const count = writable(0);

// Component.svelte
import { count } from './store';
$: doubled = $count * 2;
```

#### After (Svelte 5 style)
```javascript
// Component.svelte
let count = $state(0);
let doubled = $derived(count * 2);
```

---

### 2. Context API 활용

전역 store 대신 Context로 상태 전달:

```javascript
// +layout.svelte (부모)
import { setContext } from 'svelte';

let { data } = $props();
setContext('user', () => data.user); // 함수로 전달 (reactivity 유지)

// +page.svelte (자식)
import { getContext } from 'svelte';

const getUser = getContext('user');
const user = getUser();

<p>안녕하세요, {user.name}님!</p>
```

**왜 함수로?** → reactivity를 context 경계 너머로 전달하기 위해

---

### 3. URL 기반 상태 관리

필터/정렬 등은 URL에 저장:

```javascript
// +page.js
export function load({ url }) {
  const sort = url.searchParams.get('sort') ?? 'latest';
  const filter = url.searchParams.get('filter') ?? 'all';

  return { sort, filter };
}

// +page.svelte
import { goto } from '$app/navigation';

function changeSort(newSort) {
  goto(`?sort=${newSort}&filter=${data.filter}`);
}
```

**장점**: 새로고침해도 상태 유지, URL 공유 가능

---

## 체크리스트

리팩토링 시 확인사항:

- [ ] `$derived` 내부에 부수효과 없음
- [ ] 불필요한 `$derived` 제거 (`const` 사용)
- [ ] 서버 파일에 전역 상태 없음
- [ ] `load` 함수에서 store 변경 없음
- [ ] Context 활용 검토
- [ ] URL 상태 관리 필요 여부 검토
- [ ] Single Source of Truth 원칙 준수

---

## 참고 자료

- [Svelte 5 공식 문서](https://svelte.dev/docs)
- [SvelteKit State Management](https://svelte.dev/docs/kit/state-management)
- [Svelte 5 Runes RFC](https://github.com/sveltejs/rfcs/blob/master/text/0000-runes.md)
