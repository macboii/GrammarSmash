# Development Plan

> **방향 전환 (2026-04-29)**: New Tab Runner → Idle 감지 + Toast + Action Popup Shooter
> 재사용 가능: `grammar.json` 데이터(구조 변경 필요), Result Screen HTML/CSS, 상태머신 패턴

---

## Phase 1 — GrammarSmash 게임 엔진 `진행중`

> **완료 기준**: `index.html`을 브라우저에서 직접 열어 슈터 게임 전체 루프 동작 확인
> **최종 검증**: `/test-extension 1` 실행 후 전 항목 통과

| # | 작업 | 최소 검증 | 상태 |
|---|------|-----------|------|
| 1-1 | `grammar.json` 재구성: `isCorrect` 필드 추가, 정답/오답 문장 각 15개 이상 | JSON 파싱 오류 없음 + 정답/오답 비율 확인 | 완료 |
| 1-2 | `game.js`: 플레이어(좌우 이동) + 문장 낙하 + 총알 시스템 | 캐릭터 렌더링 + 좌우 이동 + 총알 발사 | 완료 |
| 1-3 | 충돌 처리: 오답 격추 → 점수, 정답 격추 → FAIL, 오답 통과 → 점수 감소 | 각 충돌 케이스 3가지 정상 동작 | 완료 |
| 1-4 | Result Screen 연결 (기존 HTML/CSS 재사용) | FAIL 후 0.3초 내 Result Screen + TextBoi CTA | 완료 |
| 1-5 | `manifest.json` 업데이트: action popup + storage (content_scripts는 Phase 2) | Chrome 로드 오류 없음 + 아이콘 클릭 시 팝업 오픈 | 완료 |

## Phase 2 — Idle 감지 + Toast `예정`

> **완료 기준**: 실제 웹 페이지에서 45초 idle 후 Toast 등장 + 클릭 시 게임 팝업 오픈
> **최종 검증**: `/test-extension 2` 실행 후 전 항목 통과

| # | 작업 | 최소 검증 | 상태 |
|---|------|-----------|------|
| 2-1 | `idle.js`: mousemove/keydown/scroll 감지, 45초 타이머 | DevTools console에서 타이머 리셋 확인 | 완료 |
| 2-2 | `toast.js`: 하단 우측 Toast UI + 5초 자동 닫힘 | Toast 렌더링 + 버튼 클릭 시 팝업 오픈 | 완료 |
| 2-3 | 노출 제한: `chrome.storage.local`로 하루 1회 제한 | 게임 후 당일 재노출 안 됨 확인 | 완료 |

## Phase 3 — 통합 + 폴리시 `예정`

> **완료 기준**: 실 사용 시나리오 전체 흐름 오류 없음
> **최종 검증**: `/test-extension 3` 실행 후 전 항목 통과

| # | 작업 | 최소 검증 | 상태 |
|---|------|-----------|------|
| 3-1 | Toast → 팝업 전환 애니메이션 + 스타일 통일 | 시각적 깨짐 없음 | 완료 |
| 3-2 | 전체 흐름 통합 테스트 (Idle → Toast → Game → Result → CTA) | 퍼널 5단계 연속 동작 | 완료 |

## Phase 4 — 배포 `완료`

| # | 작업 | 최소 검증 | 상태 |
|---|------|-----------|------|
| 4-1 | `icon.png` 128×128 교체 (GrammarSmash 브랜딩) | Chrome Extensions 페이지 아이콘 표시 | 완료 |
| 4-2 | Chrome Web Store 패키징 + 스토어 설명 | CWS 업로드 오류 없음 | 완료 |

## Phase 5 — 콤보 + 재플레이 동기 시스템 `완료`

> **목표**: "한 번 더 하게 만드는 이유" 3가지를 추가 — Best Score 강조 + 콤보 시스템 + New Record 피드백
> **완료 기준**: 연속 격추 시 콤보 카운터 상승 + 속도 증가 + Result Screen에 Best Score / 최대 콤보 표시
> **최종 검증**: `/test-extension 5` 실행 후 전 항목 통과

| # | 작업 | 최소 검증 | 상태 |
|---|------|-----------|------|
| 5-1 | 콤보 카운터: 연속 성공(오답 격추 / 정답 접촉)마다 +1, FAIL 시 게임 종료 | HUD에 콤보 카운터 실시간 표시 | 완료 |
| 5-2 | 콤보 속도 보너스: 5콤보마다 fallSpeed 추가 부스트 + `🔥 xN` FloatingText | 5콤보 달성 시 체감 속도 증가 확인 | 완료 |
| 5-3 | Result Screen: Best Score 강조 표시 + `🔥 New Record!` 플래시 (갱신 시) + 최대 콤보 표시 | 신기록 갱신 시 플래시 애니메이션 동작 | 완료 |

## Phase 6 — Leaderboard (Supabase) `진행중`

> **목표**: 마찰 최소 + 글로벌 랭킹으로 "한 번 더" 동기 강화
> **UX 원칙**: 이름 입력 최초 1회만 → 이후 자동 제출 → 내 순위 즉시 표시
> **Supabase**: textBoi-us 프로젝트 (`azgplnfczforimmtpznx`), 테이블 `grammarsmash_leaderboard`

| # | 작업 | 최소 검증 | 상태 |
|---|------|-----------|------|
| 6-1 | Supabase 테이블 생성 + RLS 정책 (public read/insert, score ≤ 1000) | MCP migration 성공 | 완료 |
| 6-2 | `manifest.json` host_permissions 추가 (Supabase URL) | Chrome 로드 오류 없음 | 완료 |
| 6-3 | Result Screen: 첫 게임 후 닉네임 입력 UI → localStorage 저장 | 닉네임 저장 후 재입력 요구 없음 | 완료 |
| 6-4 | 점수 자동 제출 (score > 0) + Top 50 조회 + "You are #N" 표시 | 제출 후 리더보드 렌더링 확인 | 완료 |
| 6-5 | 네트워크 오류 시 silent fail (게임 흐름 중단 없음) | 오프라인에서 게임 정상 동작 | 완료 |

---

> **작업 규칙**: 각 작업의 최소 검증 통과 후 다음 진행.
> 한 Phase 완료 기준 통과 후 다음 Phase 시작.
> 완료 시 상태 칸을 `완료`로 업데이트한다.
