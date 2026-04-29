# Skill: Idle System

Idle 감지 + Toast 노출 제한 공통 패턴입니다.
`idle.js`와 `toast.js`는 content script로 실행됩니다.

## Idle 감지 (`idle.js`)

```js
const IDLE_MS = 45_000;
let idleTimer = null;

function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(triggerToast, IDLE_MS);
}

['mousemove', 'keydown', 'scroll', 'click'].forEach(ev =>
  document.addEventListener(ev, resetIdle, { passive: true })
);

resetIdle();
```

## 노출 제한 (`chrome.storage.local`)

```js
const STORAGE_KEY = 'grammarblitz_last_shown';
const ONE_DAY_MS = 86_400_000;

async function canShow() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const last = result[STORAGE_KEY] || 0;
  return Date.now() - last > ONE_DAY_MS;
}

async function markShown() {
  await chrome.storage.local.set({ [STORAGE_KEY]: Date.now() });
}
```

> ⚠️ content script에서 `localStorage` 사용 금지 — 페이지별로 격리되어 전역 제한이 불가.
> 반드시 `chrome.storage.local` 사용.

## Toast UI (`toast.js`)

```js
async function triggerToast() {
  if (!(await canShow())) return;
  await markShown();

  const toast = createToastEl(); // Shadow DOM으로 생성
  document.body.appendChild(toast);
  const shadow = toast.shadowRoot;
  const autoClose = setTimeout(() => toast.remove(), 5000);

  shadow.querySelector('.play').addEventListener('click', () => {
    clearTimeout(autoClose);
    chrome.runtime.sendMessage({ action: 'openGame' }); // background.js가 수신
    toast.remove();
  });
  shadow.querySelector('.close').addEventListener('click', () => {
    clearTimeout(autoClose);
    toast.remove();
  });
}
```

## Toast 스타일 요구사항

- `position: fixed; bottom: 24px; right: 24px; z-index: 2147483647`
- **반드시 Shadow DOM** 사용 — `attachShadow({ mode: 'open' })` — 페이지 CSS 격리
- slide-in 애니메이션 (`translateY(20px) → 0`, 0.3s ease)
- 자동 닫힘: 5초, 버튼 클릭 시 `clearTimeout` 후 즉시 제거

## 주의사항

- `chrome.action.openPopup()`은 content script에서 직접 호출 불가
- 게임 탭 열기는 `chrome.runtime.sendMessage({ action: 'openGame' })` → background.js가 `chrome.tabs.create` 처리
- `canShow` / `markShown`은 `toast.js`에 위치 (UI 파일이 노출 제한 소유)
