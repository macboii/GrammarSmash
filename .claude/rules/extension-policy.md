# Chrome Extension Policy

## manifest.json 기준 스펙

```json
{
  "manifest_version": 3,
  "name": "GrammarSmash",
  "version": "1.0.0",
  "description": "Fast grammar shooter game",
  "permissions": ["storage", "tabs"],
  "icons": { "128": "assets/icon.png" },
  "action": {
    "default_icon": { "128": "assets/icon.png" }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["idle.js", "toast.js"]
    }
  ]
}
```

## Manifest V3 규칙

- `manifest_version: 3` 고정 (V2 코드 패턴 사용 금지)
- `default_popup` 사용 금지 — 게임은 항상 새 탭으로 열림 (`background.js` → `chrome.tabs.create`)
- Chrome 팝업 최대 너비 한계(~800px)로 인해 팝업 방식 폐기. 탭 방식이 표준
- `host_permissions` 추가 시 반드시 사용자 확인

## 스토리지 정책 (중요)

- **content script (`idle.js`, `toast.js`)** 에서는 `localStorage` 사용 금지
  - content script의 `localStorage`는 방문 중인 페이지의 저장소 — 페이지마다 다름
  - 노출 제한 등 extension 전역 상태는 반드시 `chrome.storage.local` 사용
- **게임 페이지 (`index.html`, `game.js`)** 에서는 `localStorage` 사용 가능
- `chrome.storage.local` 사용 시 `"storage"` permission 필수 (manifest에 포함됨)

## 성능 요구사항

| 항목 | 목표 |
|------|------|
| 초기 로딩 | < 1초 |
| FPS | 60 유지 |
| 총 번들 크기 | < 5MB |
| 오프라인 동작 | 필수 |

## CSP (Content Security Policy)

- `eval()` 사용 금지
- `new Function()` 사용 금지
- 인라인 이벤트 핸들러 금지 (`onclick=""` 등)
- 외부 스크립트 로드 금지 (CDN, unpkg 등)
- Phaser.js 사용 시 반드시 로컬 번들 파일로

## 스토리지

- `localStorage` (게임 페이지): bestScore, nickname
- `chrome.storage.local` (content script): 노출 제한 타임스탬프
- Supabase (Phase 6+): 글로벌 리더보드 — textBoi-us 프로젝트 `azgplnfczforimmtpznx`
  - 테이블: `grammarsmash_leaderboard` (nickname UNIQUE, score, created_at)
  - SDK 없이 `fetch()` REST API 직접 호출 (CDN 로드 금지 정책 유지)
  - `host_permissions` 필수: `"https://azgplnfczforimmtpznx.supabase.co/*"`
  - anon key는 코드에 포함 허용 (RLS + DB 제약으로 보호)
  - **스팸/점수 조작 방지 구조** (DB 레벨, 클라이언트 코드 변경 불필요):
    - `UNIQUE(nickname)` — 닉네임당 행 1개
    - `keep_best_score` BEFORE INSERT 트리거 — 기존 닉네임이면 더 높은 점수만 UPDATE, INSERT 취소
    - `score CHECK (0~1000)` — 비정상 점수 차단
    - textBoi user_* 테이블 전체: RLS deny all 또는 `auth.uid()` 필수 → anon 접근 불가
  - 네트워크 실패 시 silent fail — 게임 흐름 절대 중단 금지

## 아이콘 요구사항

- `icon.png`: 128x128px 필수
- 투명 배경 권장
- Chrome Web Store 가이드라인 준수

## 배포 체크리스트

- [ ] manifest.json 유효성 확인
- [ ] 모든 리소스 로컬 포함 확인
- [ ] CSP 위반 없음 확인
- [ ] 오프라인 동작 테스트
- [ ] Chrome Extensions 페이지에서 압축 해제 로드 테스트
