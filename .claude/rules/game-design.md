# Game Design Rules

## 게임 철학

- "생각"이 아니라 "반응" 기반 게임플레이
- 1판 목표 = 10~15초 (너무 길면 안 됨)
- 즉시 시작, 즉시 실패, 즉시 재시작 (메뉴 없음)
- 작업 중 방해 금지 — idle 상태에서만 등장

## 상태 머신 규칙

모든 게임은 아래 상태만 가짐:

```
INIT → RUNNING → FAIL → RESULT → RESTART(→ RUNNING)
```

- `INIT`: 인트로 화면 표시 (규칙 테이블 + 조작법). Space/클릭으로 RUNNING 진입
- 재시작(Play Again)은 INIT을 거치지 않고 곧바로 RUNNING
- 상태 전환은 반드시 `setState(newState)` 함수를 통해서만
- 상태 바깥에서 직접 변수 변경 금지

## GrammarSmash 게임 규칙 (Shooter)

- 플레이어: 화면 하단 중앙, ← → 키 / 마우스로 좌우 이동
- 문장들이 화면 상단에서 낙하
- Space / 클릭 → 총알 발사 (위쪽)

| 상황 | 오답 문장 (빨강 WRONG) | 정답 문장 (초록 CORRECT) |
|------|----------------------|------------------------|
| 총알로 맞추면 | ✅ 점수 +2 | ❌ 즉시 FAIL |
| 플레이어가 부딪히면 | ❌ 즉시 FAIL | ✅ 점수 +3 (먹기) |
| 바닥 통과(놓치면) | ❌ 즉시 FAIL | ❌ 즉시 FAIL |
- Space / 클릭 → 총알 발사

## 레벨 시스템 (Lv0–Lv10)

```js
const LEVEL_THRESHOLDS = [0, 5, 12, 21, 32, 45, 60, 77, 96, 117, 140];
```

- 점수가 임계값을 넘을 때마다 레벨 업 (`_checkLevelUp()`은 `_addScore()` 내에서 호출)
- 레벨 업 시: 청록색 `⬆ LvN` FloatingText + `levelUp()` 사운드
- HUD에 현재 레벨 상시 표시 (`#hud-level`, cyan `#22d3ee`)
- Result Screen에 "Level reached: LvN" 표시

## 난이도 곡선

- 레벨과 점수가 함께 낙하 속도를 결정 — 레벨 업 시 체감 점프
- 속도 상한선 필수 (무한 증가 금지)

```js
// 낙하 속도: 레벨 기여 + 점수 기여
fallSpeed = Math.min(BASE_FALL + level * 15 + score * 2, MAX_FALL)

// 스폰 쿨다운: 레벨이 올라갈수록 빠르게 좁아짐
spawnCooldown = Math.max(2.5 - level * 0.15 - score * 0.02, 0.8)
```

## 콤보 시스템 (Phase 5)

- 연속 성공(오답 격추 or 정답 접촉)마다 `combo` +1
- 5콤보마다 fallSpeed 추가 부스트 + `🔥 xN COMBO` FloatingText 표시
- 게임 종료(FAIL) 시 콤보는 자동 종료 — 별도 리셋 불필요
- Result Screen에 **최대 콤보** 수치 표시

```js
combo++;
if (combo % 5 === 0) {
  fallSpeed = Math.min(fallSpeed + 20, MAX_FALL);
  // FloatingText: `🔥 x${combo} COMBO`
}
maxCombo = Math.max(maxCombo, combo);
```

## Best Score / New Record (Phase 5)

- Best Score는 `localStorage.grammarSmashBest`에 저장
- 신기록 갱신 시 Result Screen에 `🔥 New Record!` 플래시 애니메이션
- "한 번 더" 유도가 목적

## 사운드 시스템

- **Web Audio API** 사용 — 오디오 파일 0개, 코드로 합성
- `AudioContext`는 첫 `_startLoop()` 호출 시 resume (Chrome 자동 정지 정책 대응)
- 오프라인 동작·CSP 정책 모두 충족

| 이벤트 | 메서드 | 특성 |
|--------|--------|------|
| 총 발사 | `shoot()` | 하강 square sweep |
| 오답 격추 +2 | `hitWrong()` | pop + 후속 tone |
| 정답 접촉 +3 | `eatCorrect()` | 상승 sine sweep |
| FAIL | `fail()` | 하강 sawtooth + 저음 |
| 5콤보 | `combo()` | 4음 arpeggio |
| 레벨 업 | `levelUp()` | 5음 ascending jingle |

## 배경

- `StarField` 클래스: 3레이어(멀리·중간·가까이) 별들이 아래로 흘러 상승 비행감 연출
- 가장 빠른 별에 motion streak (상향 궤적) 적용
- `draw()` 첫 번째 호출, `update()` 첫 번째 호출 — 인트로 화면에도 동일하게 표시

## Canvas 크기

- `CANVAS_WIDTH = 600`, `CANVAS_HEIGHT = 400`, `GROUND_Y = 368` (슈터에 적합한 세로형)
- 반응형: CSS `transform: scale()`로만 조절

## Result Screen 규칙

- 게임 종료 후 0.3초 딜레이 후 표시
- TextBoi CTA 항상 표시 (조건부 숨김 금지)
- "Play Again"은 Space로도 동작
- 최고 점수는 `chrome.storage.local`에 저장 (content script 환경 고려)

## FAIL 원인 설명 (필수)

FAIL 발생 시 Result Screen에 원인 문장과 영어 설명을 반드시 표시한다.

**표시 형식:**
```
❌ You shot a correct sentence!        (정답 격추로 FAIL)
  "She goes to the market every day"
  → 'Goes' is correct — third-person singular needs -s.

또는

💨 You missed a wrong sentence!        (오답 통과로 감점)
  "She go to the market every day"
  → 'Go' → 'goes': third-person singular needs -s.
```

**구현 규칙:**
- FAIL 유발 문장 객체를 `game.failSentence`에 저장해 Result Screen에 전달
- `failReason`: `'shot-correct'` (정답 격추) | `'missed-wrong'` (오답 통과)
- `explanation` 필드는 `grammar.json`에서 로드 (하드코딩 금지)
- 설명 영역은 Result Screen의 고정 영역 — 항상 표시, 빈 경우 없음

## 접근성

- 마우스 클릭/터치로도 총알 발사
- 색맹 대비: 정답/오답 구분에 색상 외 텍스트 레이블 병행

## 데이터 구조

**로딩 순서** (`main.js`): Supabase → 로컬 `grammar.json` → 하드코딩 fallback

**Supabase 테이블** (`grammarsmash_sentences`, textBoi-us 프로젝트):

| 컬럼 | 타입 | 설명 |
|------|------|------|
| sentence | text | 문장 |
| is_correct | boolean | 정답 여부 |
| explanation | text | 영어 설명 (필수) |
| category | text | 카테고리 (선택) |

- JS 매핑: `is_correct` → `isCorrect`, `explanation` 그대로 사용
- 로딩 시 10개 미만이면 로컬 fallback으로 전환
- `explanation` 필드 필수 — Result Screen에 항상 표시됨

**비율 규칙**: 정답 : 오답 ≈ 1:2 (정답이 너무 많으면 게임 불가)
