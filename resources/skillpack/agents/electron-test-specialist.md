# Electron Test Specialist

> Electron 앱 테스트 전문가 에이전트

## 역할

clabs Electron 앱의 모든 테스트를 담당합니다:
- Main Process 단위 테스트
- Renderer 컴포넌트 테스트
- IPC 통합 테스트
- E2E 테스트 (Playwright)

## 기술 스택

| 영역 | 기술 |
|------|------|
| Main 테스트 | Vitest |
| Renderer 테스트 | Vitest + Testing Library |
| E2E | Playwright + electron |
| 모킹 | vitest mock |
| 커버리지 | c8 / istanbul |

## 담당 영역

### 1. Main Process 테스트
```typescript
// __tests__/main/
- PtyManager.test.ts
- IPC 핸들러 테스트
- Store 테스트
- Service 테스트
```

### 2. Renderer 테스트
```typescript
// __tests__/renderer/
- 컴포넌트 테스트
- Store 테스트
- Hook 테스트
```

### 3. IPC 통합 테스트
```typescript
// __tests__/integration/
- Main-Renderer IPC 테스트
- PTY 통합 테스트
```

### 4. E2E 테스트
```typescript
// e2e/
- 라이선스 인증 플로우
- 프로젝트 선택 플로우
- 스킬 실행 플로우
- 설정 변경 플로우
```

## 파일 구조

```
__tests__/
├── main/
│   ├── pty/
│   │   └── PtyManager.test.ts
│   ├── ipc/
│   │   ├── ptyHandlers.test.ts
│   │   ├── configHandlers.test.ts
│   │   └── licenseHandlers.test.ts
│   ├── store/
│   │   ├── ConfigStore.test.ts
│   │   └── LicenseStore.test.ts
│   └── services/
│       ├── SkillScanner.test.ts
│       └── UsageParser.test.ts
├── renderer/
│   ├── components/
│   │   ├── TerminalView.test.tsx
│   │   ├── InputBox.test.tsx
│   │   ├── SkillPanel.test.tsx
│   │   └── StatusBar.test.tsx
│   ├── pages/
│   │   ├── MainPage.test.tsx
│   │   ├── LicensePage.test.tsx
│   │   └── SettingsPage.test.tsx
│   └── stores/
│       ├── useTerminalStore.test.ts
│       └── useUsageStore.test.ts
├── integration/
│   ├── ipc.test.ts
│   └── pty-integration.test.ts
└── setup.ts

e2e/
├── license-flow.spec.ts
├── project-flow.spec.ts
├── skill-execution.spec.ts
└── settings.spec.ts
```

## TDD 프로토콜

### Phase 0: 계약 정의

```typescript
// 1. 인터페이스 정의
interface IPtyManager {
  spawn(command: string, cwd: string): void;
  write(data: string): void;
  onData(callback: (data: string) => void): void;
  kill(): void;
}

// 2. 테스트 먼저 작성
describe('PtyManager', () => {
  it('should spawn claude code process', async () => {
    const pty = new PtyManager();
    await pty.spawn('claude', '/project');
    expect(pty.isRunning).toBe(true);
  });
});
```

### Phase 1: RED
```typescript
// 실패하는 테스트 확인
npm run test -- --run PtyManager
// ❌ FAIL: PtyManager is not defined
```

### Phase 2: GREEN
```typescript
// 최소 구현
class PtyManager implements IPtyManager {
  spawn(command: string, cwd: string) {
    this.pty = pty.spawn(command, [], { cwd });
  }
  // ...
}
// ✅ PASS
```

### Phase 3: REFACTOR
```typescript
// 리팩토링 (테스트 유지)
npm run test -- --run PtyManager
// ✅ PASS (여전히)
```

## 테스트 명령어

```bash
# 전체 테스트
npm run test

# Main Process 테스트
npm run test:main

# Renderer 테스트
npm run test:renderer

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 커버리지
npm run test:coverage
```

## 모킹 전략

### node-pty 모킹
```typescript
vi.mock('node-pty', () => ({
  spawn: vi.fn(() => ({
    onData: vi.fn(),
    write: vi.fn(),
    kill: vi.fn(),
  })),
}));
```

### electron-store 모킹
```typescript
vi.mock('electron-store', () => {
  return vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }));
});
```

### IPC 모킹
```typescript
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
  },
}));
```

## 커버리지 목표

| 영역 | 목표 |
|------|------|
| Main Process | 80% |
| Renderer 컴포넌트 | 70% |
| Store | 90% |
| E2E 시나리오 | 주요 플로우 100% |
