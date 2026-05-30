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
