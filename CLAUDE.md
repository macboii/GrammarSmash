# GrammarSmash — Chrome Extension

## 프로젝트 개요

사용자가 **idle 상태일 때만** Toast를 띄워 10~15초짜리 Grammar Shooter 게임을 제안하고,
"수동 교정의 피로"를 체험시킨 뒤 TextBoi(https://textboi.ai)로 자연스럽게 전환시키는 Chrome Extension.

**퍼널**: Idle → Toast → Click → Game → Fail → (최초 1회 닉네임 입력) → 리더보드 + Best Score + 콤보 → CTA → Restart
**UX 원칙**: 작업 중 방해 금지, idle 상태에서만 등장, 하루 1회 노출 제한

---

## 기술 스택

- **Runtime**: Vanilla JS + Canvas API (Phaser 사용 금지)
- **Extension**: Chrome Manifest V3
- **Assets**: 순수 CSS/SVG, 외부 CDN 금지
- **번들러**: 없음 (단일 파일 직접 로드)

---

## 폴더 구조

```
/extension
 ├── manifest.json
 ├── background.js     # service worker — 아이콘 클릭/toast 메시지 → 새 탭 오픈
 ├── index.html        # 게임 페이지 (새 탭으로 열림)
 ├── game.js           # GrammarSmash 게임 엔진 ✓
 ├── idle.js           # Idle 감지 content script ✓
 ├── toast.js          # Toast UI content script ✓
 ├── main.js           # 초기화 + JSON 로드
 ├── data/
 │    └── grammar.json  # 로컬 fallback용 (Supabase grammarsmash_sentences가 primary)
 └── assets/
      └── icon.png
```

---

## 게임 루프

```
INIT → RUNNING → FAIL → RESULT → RESTART(→ RUNNING)
```

---

## 규칙 & 계획 문서

| 파일 | 담당 내용 |
|------|----------|
| `.claude/rules/development-plan.md` | Phase별 작업 목록 + 완료 기준 |
| `.claude/rules/game-design.md` | 게임 철학, 상태머신, 슈터 메카닉, 데이터 구조 |
| `.claude/rules/extension-policy.md` | MV3, CSP, manifest 스펙, 스토리지 정책 |
| `.claude/rules/coding-style.md` | JS 컨벤션, Canvas 규칙, 에러 처리 |
| `.claude/rules/commands.md` | 커맨드 파일 작성 규칙 |
| `.claude/skills/game-state-machine.md` | 상태머신 구현 템플릿 |
| `.claude/skills/idle-system.md` | Idle 감지 + Toast 노출 제한 구현 |
| `.claude/skills/result-screen.md` | Result Screen + 닉네임 입력 + 리더보드 구현 |
