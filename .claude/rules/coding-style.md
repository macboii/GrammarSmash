# Coding Style Rules

## 일반

- 파일당 단일 책임 (게임 하나 = 파일 하나)
- 전역 변수 금지 — 모든 상태는 게임 객체 내부에 보관
- `var` 금지, `const` 우선 / `let` 필요 시만
- 함수는 20줄 이하로 유지, 초과 시 분리

## 네이밍

- 클래스: `PascalCase` (e.g., `GrammarRunner`)
- 함수/변수: `camelCase`
- 상수: `UPPER_SNAKE_CASE` (e.g., `BASE_SPEED`)
- 게임 상태 enum: `GAME_STATE.RUNNING` 패턴

## 주석

- WHY만 작성, WHAT은 생략
- 게임 수식/물리 공식에만 인라인 주석 허용

## Canvas

- 크기: `CANVAS_WIDTH = 600`, `CANVAS_HEIGHT = 400` 상수로 고정
- 반응형: Canvas 자체 크기는 고정, 래퍼에 CSS `zoom` 속성으로만 조절 (`transform: scale` 금지 — layout 반영 안 돼 클리핑 발생)
- Phaser.js 사용 금지 — 순수 Canvas API만
- `requestAnimationFrame` 루프만 사용 (`setInterval` 금지)
- draw / update 함수 분리 필수
- Canvas context는 `ctx` 변수명 고정

## Chrome Extension 규칙

- `chrome.*` API는 최소화 (현재 `permissions: []`)
- CSP 위반 코드 금지 (inline script, eval 금지)
- 모든 리소스는 로컬 번들 (외부 CDN fetch 금지)
- `index.html`에서 `<script src="">` 로드만 허용

## 에러 처리

- 게임 로직 내부 에러는 조용히 처리 (콘솔 warn 허용)
- JSON 로드 실패 시 내장 fallback 데이터 사용
- 절대 alert() 사용 금지
