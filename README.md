# Clabs - Claude Code GUI

**Claude Code를 위한 데스크톱 GUI 클라이언트**

Clabs는 Anthropic의 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI를 감싸는 네이티브 데스크톱 앱입니다. 터미널에서 Claude Code를 실행하되, 멀티탭 워크스페이스, 스킬팩 사이드바, 명령어 자동완성 등 생산성 기능을 추가합니다.

> **Tauri v2 + React 19 + Rust** 기반. macOS / Windows / Linux 지원.

---

## 주요 기능

### 멀티탭 워크스페이스

여러 프로젝트를 탭으로 열고 전환할 수 있습니다. 탭 전환 시 PTY 세션과 터미널 스크롤백이 완전히 보존됩니다.

- `+` 버튼으로 새 프로젝트 탭 추가
- 탭 간 전환 시 기존 Claude Code 세션 유지 (display:none, PTY 미종료)
- 탭 닫기 시 해당 프로젝트의 PTY만 정리

### 스플릿 패인 터미널

하나의 탭 안에서 터미널을 수평/수직으로 분할하여 여러 Claude Code 인스턴스를 동시에 실행할 수 있습니다.

### 스킬팩 사이드바

60+ 커스텀 스킬을 카테고리별로 탐색하고 원클릭으로 실행합니다.

- **빠른 실행**: Claude 기본, Opus 모드, 대화 계속 등 프리셋
- **기본 명령어**: `/clear`, `/compact`, `/model` 등 19개 빌트인
- **번들 스킬**: `/simplify`, `/batch`, `/loop` 등 5개
- **커스텀 스킬**: 프로젝트별 스킬팩에서 자동 로드
- **MCP 서버**: 연결된 MCP 서버 상태 표시

### 명령어 입력 강화

- **Tab 자동완성**: PTY의 현재 작업 디렉토리 기준으로 파일/폴더명 자동완성
- **다중 매치 드롭다운**: 여러 후보가 있으면 목록에서 선택
- **`/` 명령어 자동완성**: 슬래시 명령어 입력 시 드롭다운 필터링
- **히스토리 드롭다운**: `↑` 키로 최근 명령어 목록 표시 및 선택
- **확장 입력 모달**: 긴 프롬프트 작성을 위한 대형 텍스트 에디터 (`Cmd+Enter` 전송)
- **고스트 텍스트**: Claude Code의 프롬프트 제안을 `[Tab]`으로 수락

### CLI 빌더

Claude Code의 CLI 플래그를 GUI로 조합하여 명령어를 생성합니다. `--model`, `--max-turns`, `--dangerously-skip-permissions` 등 15개 플래그를 드래그앤드롭으로 구성.

### 툴바 바로가기

자주 사용하는 명령어를 사이드바에서 별표(pin)하면 상단 툴바에 바로가기로 추가됩니다.

### 테마

9개 다크/라이트 테마 프리셋 지원:
Default Dark, Gruvbox, Dracula, One Dark, Nord, Solarized, Tokyo Night 등.

---

## 설치

### macOS (소스에서 빌드)

```bash
# 사전 요구 사항
# - Node.js 18+
# - Rust toolchain (rustup)
# - Claude Code CLI (npm install -g @anthropic-ai/claude-code)

# 클론
git clone https://github.com/vibelabs-web/clabs-tauri.git
cd clabs-tauri

# 의존성 설치
npm install

# 개발 모드 실행
npm run tauri:dev

# 프로덕션 빌드 (.app + .dmg)
npx tauri build

# /Applications에 설치
cp -R src-tauri/target/release/bundle/macos/Clabs.app /Applications/
```

### Windows

```bash
# 사전 요구 사항
# - Node.js 18+
# - Rust toolchain + MSVC Build Tools
# - Claude Code CLI

git clone https://github.com/vibelabs-web/clabs-tauri.git
cd clabs-tauri
npm install
npx tauri build
```

빌드 결과: `src-tauri/target/release/bundle/nsis/Clabs_*_x64-setup.exe`

### Linux

```bash
# 사전 요구 사항 (Ubuntu/Debian)
# sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file
# sudo apt install libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

git clone https://github.com/vibelabs-web/clabs-tauri.git
cd clabs-tauri
npm install
npx tauri build
```

빌드 결과: `src-tauri/target/release/bundle/deb/` 및 `appimage/`

---

## 사용법

### 기본 워크플로우

1. **앱 실행** → 프로젝트 폴더 선택
2. 터미널에 자동으로 쉘이 시작됨
3. **하단 입력창**에 명령어 입력 → Enter로 전송
4. Claude Code 실행: `claude --dangerously-skip-permissions`
5. 프롬프트 입력 → Claude와 대화

### 멀티 프로젝트

1. **탭 바의 `+`** 클릭
2. 다른 프로젝트 폴더 선택
3. 새 탭에서 독립된 Claude Code 세션 시작
4. 탭 클릭으로 전환 (기존 세션 유지)

### 명령어 입력

| 동작 | 방법 |
|------|------|
| 폴더명 자동완성 | `cd fol` + `Tab` |
| 슬래시 명령어 | `/` 입력 → 드롭다운에서 선택 |
| 히스토리 | `↑` 키 → 목록에서 선택 |
| 긴 프롬프트 | 입력창 우측 확장 아이콘 클릭 |
| 실행 중단 | `ESC` (Ctrl+C 전송) |
| 프롬프트 제안 수락 | `Tab` |

### 스킬 사용

사이드바에서 원하는 스킬 클릭 → 입력창에 명령어 자동 입력 → Enter로 실행.

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | [Tauri v2](https://v2.tauri.app/) |
| 프론트엔드 | React 19, TypeScript 5, TailwindCSS 3 |
| 상태 관리 | Zustand |
| 터미널 | xterm.js 5 + FitAddon + Unicode11Addon |
| 백엔드 | Rust (portable-pty, serde, dirs) |
| PTY 관리 | 멀티 PTY 풀 (pane별 독립 프로세스) |
| 빌드 | Vite 5 + Cargo |

---

## 프로젝트 구조

```
clabs-tauri/
├── src/
│   ├── renderer/           # React 프론트엔드
│   │   ├── components/     # UI 컴포넌트
│   │   │   ├── layout/     # TitleBar, MainLayout, SkillPanel, StatusBar
│   │   │   ├── terminal/   # SplitPaneContainer, PaneView, TerminalView, InputBox
│   │   │   ├── project/    # ProjectSelector
│   │   │   └── settings/   # SettingsModal
│   │   ├── stores/         # Zustand 스토어
│   │   │   ├── workspace.ts  # 멀티탭 워크스페이스
│   │   │   ├── pane.ts       # 패인 트리
│   │   │   └── ...
│   │   ├── pages/          # MainPage, SettingsPage 등
│   │   └── api/            # tauri-bridge.ts (IPC 래퍼)
│   └── shared/             # 공유 타입, 상수
├── src-tauri/
│   └── src/
│       ├── pty.rs          # PTY 풀 매니저
│       ├── commands.rs     # Tauri 커맨드 (IPC)
│       ├── lib.rs          # 앱 설정 및 플러그인
│       └── ...
└── resources/
    └── skillpack/          # 커스텀 스킬 정의 파일
```

---

## 개발

```bash
# 개발 서버 (핫 리로드)
npm run tauri:dev

# 타입 체크
npm run typecheck

# 린트
npm run lint

# 테스트
npm run test
```

---

## 라이선스

[MIT](LICENSE)

---

## 링크

- [VibeLabs 스킬 마켓](https://vibelabs.kr/skills/new)
- [VideoGen - AI 영상 생성](https://vibelabs.kr/videogen/purchase/new)
- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
