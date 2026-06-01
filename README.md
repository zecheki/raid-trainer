# Shield Orb Trainer

순수 웹 기반 HTML5 Canvas 미니게임입니다. Unity, Vite, Node 없이 실행합니다.

## 실행 방법

### Windows 권장 실행

압축을 푼 뒤 프로젝트 폴더에서 `start.bat`을 더블클릭하세요.

`start.bat`은 다음 작업을 합니다.

1. 현재 폴더로 이동
2. `python -m http.server 5173 --bind 127.0.0.1` 실행
3. 기본 브라우저로 `http://127.0.0.1:5173/` 열기

### PowerShell로 실행

```powershell
./start.ps1
```

### 수동 실행

```bash
python -m http.server 5173 --bind 127.0.0.1
```

그 다음 브라우저에서 아래 주소를 여세요.

```text
http://127.0.0.1:5173/
```

## file://로 직접 열면 안 되는 이유

이 프로젝트는 ES Module을 사용합니다.

```html
<script type="module" src="./src/main.js"></script>
```

브라우저에서 `file:///.../index.html`을 직접 열면 CORS 정책 때문에 모듈 로딩이 막힐 수 있습니다. 반드시 `start.bat`, `start.ps1`, 또는 `python -m http.server 5173` 같은 로컬 HTTP 서버로 실행하세요.

## 조작

- WASD / 방향키: 이동
- Space: 시작 / 다음 시도
- R: 현재 시도 리셋

입력은 `event.key`에 의존하지 않고 `event.code` 기반으로 처리합니다. 그래서 한글 입력 상태에서도 WASD와 Space가 동작합니다.

## 파일 구조

```text
raid-trainer/
├─ index.html
├─ start.bat
├─ start.ps1
├─ README.md
└─ src/
   ├─ main.js
   ├─ style.css
   ├─ core/
   │  ├─ constants.js
   │  └─ math.js
   ├─ game/
   │  ├─ Game.js
   │  ├─ Input.js
   │  ├─ Player.js
   │  ├─ ArenaRenderer.js
   │  └─ StatsStore.js
   ├─ mechanics/
   │  ├─ ShieldOrbMechanic.js
   │  └─ Orb.js
   ├─ render/
   │  └─ draw.js
   └─ ui/
      └─ GameUI.js
```

## 구현 메모

- `src/main.js`는 canvas를 찾고 `Game`을 생성하는 역할만 합니다.
- 전역 이벤트 리스너에서 아직 생성되지 않은 `game` 변수를 참조하지 않습니다.
- 입력 이벤트는 `Input` 클래스 내부에서 받고 콜백으로 `Game`에 전달합니다.
- `ShieldOrbMechanic`은 생성자에서 안전한 기본 배열을 만들고, `Game` 생성 중 `reset()`이 끝난 뒤 UI를 갱신합니다.
- UI는 `this.shields.length` 같은 내부 필드를 직접 읽지 않고, `getSnapshot()`이 반환하는 안전한 값만 표시합니다.


## 최근 반영 사항

- 쉴드 테두리 3겹을 보스 쪽으로 더 촘촘하게 배치했습니다.
- 직선장판이 발사되기 전, 투명도가 점점 진해지는 전조선을 표시합니다.
- 구슬 판정은 보스 중심부가 아니라 현재 바깥쪽 쉴드 링에 닿는 순간 발생합니다.

## 설정값 위치

주요 난이도 값은 `src/core/constants.js`의 `MECHANIC`에서 조절합니다.

```js
ORB_SPEED: 42,                         // 구슬 이동 속도
ORB_START_DISTANCE: ARENA.RADIUS - 128, // 구슬 시작 거리
ORB_SPACING: 42,                        // 같은 라인 구슬 간격
ORBS_PER_ACTIVE_LANE: 3,                // 활성 라인당 시작 구슬 수
ORBS_PER_OUTSIDE_LANE: 3,               // 담당 밖 라인당 반투명 구슬 수
SHOW_OUTSIDE_ORBS: true,                // 담당 밖 구슬 표시 여부
OUTSIDE_ORB_ALPHA: 0.28,                // 담당 밖 구슬 투명도

BEAM_INTERVAL: 3,                       // 직선장판 주기
BEAM_TELEGRAPH_TIME: 0.9,               // 직선장판 전조 시간
BEAM_LOCK_BEFORE_FIRE: 0.5,             // 발사 전 위치 고정 시간
BEAM_WIDTH: 24,                         // 직선장판 두께

CIRCLE_AOE_ENABLED: true,             // 원형장판 사용 여부
CIRCLE_AOE_FIRST_DELAY: 0.8,        // 시작 후 첫 원형장판까지 시간
CIRCLE_AOE_INTERVAL: 1.0,           // 원형장판 독립 생성 주기
CIRCLE_AOE_MAX_COUNT: Number.POSITIVE_INFINITY, // 전체 원형장판 최대 횟수. 무제한은 Infinity
CIRCLE_AOE_RADIUS: 46,              // 원형장판 크기
CIRCLE_AOE_TELEGRAPH_TIME: 0.75,        // 원형장판 전조 시간
CIRCLE_AOE_ACTIVE_TIME: 0.22,           // 원형장판 피격 판정 시간
```

## 최근 추가 반영 사항

- 시작 시 활성 라인마다 구슬 3개를 즉시 생성합니다.
- 각 라인의 3개 구슬은 빨강/초록/파랑이 각각 하나씩 나오고, 순서만 랜덤입니다.
- 직선장판은 발사 0.5초 전 위치가 고정됩니다.
- 직선장판에 플레이어가 맞으면 실패합니다.
- 원형장판은 직선장판 주기와 무관한 독립 타이머로 계속 떨어집니다.
- 원형장판은 생성 순간의 플레이어 위치에 고정됩니다.
- 원형장판 주기와 크기는 `CIRCLE_AOE_INTERVAL`, `CIRCLE_AOE_RADIUS`로 조절합니다.
- 원형장판 전체 횟수를 제한하려면 `CIRCLE_AOE_MAX_COUNT`를 숫자로 바꾸고, 무제한은 `Number.POSITIVE_INFINITY`로 둡니다.

- 담당 밖 라인의 구슬도 반투명하게 표시합니다.
- 직선장판이 담당 밖 구슬에 닿으면 즉시 실패합니다.
- 담당 밖 구슬은 쉴드 판정에는 관여하지 않고, 쉴드에 닿으면 조용히 제거됩니다.
- 담당 밖 구슬 표시 여부와 투명도는 `SHOW_OUTSIDE_ORBS`, `OUTSIDE_ORB_ALPHA`로 조절합니다.
