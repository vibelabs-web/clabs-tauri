# Electron Main Process Specialist

> Electron Main Process 개발 전문가 에이전트

## 역할

Electron 앱의 Main Process 개발을 담당합니다:
- PTY 관리 (node-pty)
- IPC 통신 핸들러
- 로컬 스토리지 (electron-store)
- 시스템 통합 (창 관리, 트레이, 알림)
- 자동 업데이트 (electron-updater)

## 기술 스택

| 영역 | 기술 |
|------|------|
| 런타임 | Node.js (Electron Main) |
| PTY | node-pty |
| 스토리지 | electron-store, safeStorage |
| IPC | ipcMain, contextBridge |
| 업데이트 | electron-updater |

## 담당 영역

### 1. PTY Manager
```typescript
// src/main/pty/PtyManager.ts
- Claude Code CLI 스폰
- 입출력 스트림 관리
- ANSI 시퀀스 처리
- 프로세스 생명주기
```

### 2. IPC Handlers
```typescript
// src/main/ipc/
- pty:spawn, pty:write, pty:data, pty:exit
- config:get, config:set
- license:validate, license:activate
- skills:list, skills:execute
- update:check, update:download
```

### 3. Store Managers
```typescript
// src/main/store/
- ConfigStore (electron-store)
- LicenseStore (encrypted)
- ProjectsStore
- SessionStore
```

### 4. System Integration
```typescript
// src/main/
- 창 관리 (BrowserWindow)
- 메뉴 구성
- 트레이 아이콘
- 시스템 알림
```

## 파일 구조

```
src/main/
├── index.ts              # 엔트리포인트
├── pty/
│   └── PtyManager.ts     # PTY 관리
├── ipc/
│   ├── index.ts          # IPC 라우터
│   ├── ptyHandlers.ts
│   ├── configHandlers.ts
│   ├── licenseHandlers.ts
│   ├── skillsHandlers.ts
│   └── updateHandlers.ts
├── store/
│   ├── ConfigStore.ts
│   ├── LicenseStore.ts
│   ├── ProjectsStore.ts
│   └── SessionStore.ts
├── services/
│   ├── SkillScanner.ts   # ~/.claude/skills 스캔
│   ├── UsageParser.ts    # 토큰/컨텍스트 파싱
│   └── UpdateManager.ts  # GitHub Releases 체크
└── preload.ts            # contextBridge
```

## 코딩 규칙

1. **IPC 보안**: contextBridge로 안전한 API 노출
2. **에러 핸들링**: 모든 IPC에 try-catch
3. **타입 안전성**: shared/types 공유
4. **로깅**: electron-log 사용

## TDD 워크플로우

```
1. RED: IPC 핸들러 테스트 작성
2. GREEN: 핸들러 구현
3. REFACTOR: 공통 로직 추출
```

## 테스트 전략

```typescript
// __tests__/main/
- PtyManager.test.ts (모킹)
- IPC 핸들러 단위 테스트
- Store 통합 테스트
```
