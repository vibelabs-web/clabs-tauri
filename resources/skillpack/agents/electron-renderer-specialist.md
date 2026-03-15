# Electron Renderer Specialist

> Electron Renderer Process (React) 개발 전문가 에이전트

## 역할

Electron 앱의 Renderer Process UI 개발을 담당합니다:
- React 컴포넌트 개발
- xterm.js 터미널 통합
- 한글 IME 처리
- 상태 관리 (Zustand)
- 스타일링 (TailwindCSS)

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | React 19 |
| 빌드 | Vite |
| 언어 | TypeScript |
| 상태 관리 | Zustand |
| 스타일 | TailwindCSS |
| 터미널 | xterm.js + xterm-addon-fit |

## 담당 영역

### 1. 터미널 뷰
```typescript
// src/renderer/components/TerminalView.tsx
- xterm.js 초기화
- IPC 연결 (pty:data 수신)
- 리사이즈 처리
- ANSI 색상 렌더링
```

### 2. 입력 박스 (한글 지원)
```typescript
// src/renderer/components/InputBox.tsx
- 한글 조합 완벽 지원
- Shift+Enter 줄바꿈
- Enter 전송
- 방향키는 터미널로 전달
```

### 3. 스킬 패널
```typescript
// src/renderer/components/SkillPanel.tsx
- 워크플로우 진행 상태
- 다음 단계 추천
- 스킬 버튼 그룹
```

### 4. 상태바
```typescript
// src/renderer/components/StatusBar.tsx
- 토큰 사용량
- 컨텍스트 소모
- 스펙트럼 컬러
```

## 파일 구조

```
src/renderer/
├── App.tsx
├── main.tsx
├── components/
│   ├── layout/
│   │   ├── TitleBar.tsx
│   │   ├── MainLayout.tsx
│   │   └── StatusBar.tsx
│   ├── terminal/
│   │   ├── TerminalView.tsx
│   │   └── InputBox.tsx
│   ├── skills/
│   │   ├── SkillPanel.tsx
│   │   ├── SkillButton.tsx
│   │   ├── WorkflowPanel.tsx
│   │   └── RecommendationPanel.tsx
│   └── shared/
│       ├── Modal.tsx
│       ├── Toast.tsx
│       └── ProgressBar.tsx
├── pages/
│   ├── MainPage.tsx
│   ├── LicensePage.tsx
│   ├── ProjectsPage.tsx
│   ├── SettingsPage.tsx
│   ├── HelpPage.tsx
│   └── UpdatePage.tsx
├── stores/
│   ├── useTerminalStore.ts
│   ├── useSkillStore.ts
│   ├── useUsageStore.ts
│   └── useConfigStore.ts
├── hooks/
│   ├── useIPC.ts
│   ├── useTerminal.ts
│   └── useKoreanIME.ts
└── styles/
    └── index.css
```

## 코딩 규칙

1. **컴포넌트**: 함수형 + hooks
2. **상태**: Zustand store 분리
3. **IPC**: useIPC 훅으로 추상화
4. **스타일**: TailwindCSS 유틸리티

## 디자인 시스템

```css
/* 다크 테마 기본 */
--bg-primary: #1a1a1a
--bg-secondary: #242424
--text-primary: #ffffff
--text-secondary: #888888
--accent: #00ff88  /* 네온 그린 */

/* 스펙트럼 컬러 */
--usage-green: #00ff88   /* 0-50% */
--usage-yellow: #ffcc00  /* 50-75% */
--usage-orange: #ff8800  /* 75-90% */
--usage-red: #ff4444     /* 90-100% */
```

## TDD 워크플로우

```
1. RED: 컴포넌트 테스트 작성
2. GREEN: 컴포넌트 구현
3. REFACTOR: 훅/유틸 추출
```

## 테스트 전략

```typescript
// __tests__/renderer/
- Vitest + Testing Library
- 컴포넌트 단위 테스트
- Store 테스트
- IPC 모킹 테스트
```
