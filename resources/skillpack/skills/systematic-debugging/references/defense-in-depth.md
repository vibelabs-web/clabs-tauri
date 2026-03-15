# Defense-in-Depth Validation (심층 방어 검증)

## 개요

잘못된 데이터로 인한 버그를 수정할 때, 한 곳에 검증을 추가하면 충분해 보인다. 하지만 그 단일 체크는 다른 코드 경로, 리팩토링, 또는 mock에 의해 우회될 수 있다.

**핵심 원칙:** 데이터가 통과하는 모든 레이어에서 검증한다. 버그를 구조적으로 불가능하게 만든다.

---

## 왜 여러 레이어인가

단일 검증: "버그를 고쳤다"
여러 레이어: "버그를 불가능하게 만들었다"

다른 레이어가 다른 케이스를 잡는다:
- 진입점 검증이 대부분의 버그를 잡음
- 비즈니스 로직이 엣지 케이스를 잡음
- 환경 가드가 컨텍스트별 위험을 방지
- 디버그 로깅이 다른 레이어 실패 시 도움

---

## 4개 레이어

### Layer 1: 진입점 검증 (Entry Point Validation)

**목적:** API 경계에서 명백히 잘못된 입력 거부

```typescript
function createProject(name: string, workingDirectory: string) {
  // 빈 값 체크
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory cannot be empty');
  }

  // 존재 여부 체크
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }

  // 디렉토리인지 체크
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }

  // ... proceed
}
```

### Layer 2: 비즈니스 로직 검증 (Business Logic Validation)

**목적:** 이 작업에 데이터가 의미있는지 확인

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  // 비즈니스 규칙 검증
  if (!projectDir) {
    throw new Error('projectDir required for workspace initialization');
  }

  if (!sessionId || sessionId.length < 8) {
    throw new Error('Valid sessionId required');
  }

  // ... proceed
}
```

### Layer 3: 환경 가드 (Environment Guards)

**목적:** 특정 컨텍스트에서 위험한 작업 방지

```typescript
async function gitInit(directory: string) {
  // 테스트에서 temp 디렉토리 외부 git init 거부
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `Refusing git init outside temp dir during tests: ${directory}`
      );
    }
  }

  // 프로덕션에서 루트 디렉토리 보호
  if (directory === '/' || directory === '/home') {
    throw new Error(`Refusing git init in protected directory: ${directory}`);
  }

  // ... proceed
}
```

### Layer 4: 디버그 계측 (Debug Instrumentation)

**목적:** 포렌식을 위한 컨텍스트 캡처

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;

  logger.debug('About to git init', {
    directory,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    stack,
  });

  // ... proceed
}
```

---

## 패턴 적용하기

버그를 발견하면:

### 1. 데이터 흐름 추적
- 잘못된 값의 출처는 어디인가?
- 어디서 사용되는가?

### 2. 모든 체크포인트 매핑
- 데이터가 통과하는 모든 지점 나열

### 3. 각 레이어에 검증 추가
- Entry, Business, Environment, Debug

### 4. 각 레이어 테스트
- Layer 1 우회 시도 → Layer 2가 잡는지 확인

---

## 세션에서의 예시

**버그:** 빈 `projectDir`이 소스 코드에서 `git init` 일으킴

**데이터 흐름:**
1. 테스트 셋업 → 빈 문자열
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init`이 `process.cwd()`에서 실행

**추가된 4개 레이어:**

```typescript
// Layer 1: Project.create()가 빈 값/존재/쓰기 가능 검증
function createProject(name: string, dir: string) {
  if (!dir || !existsSync(dir) || !isWritable(dir)) {
    throw new Error('Invalid directory');
  }
}

// Layer 2: WorkspaceManager가 projectDir 빈 값 아닌지 검증
class WorkspaceManager {
  createWorkspace(projectDir: string) {
    if (!projectDir) throw new Error('projectDir required');
  }
}

// Layer 3: WorktreeManager가 테스트 중 tmpdir 외부 git init 거부
async function gitInit(dir: string) {
  if (process.env.NODE_ENV === 'test' && !dir.startsWith(tmpdir())) {
    throw new Error('Refusing git init outside tmpdir in tests');
  }
}

// Layer 4: git init 전 스택 트레이스 로깅
console.debug('git init', { dir, stack: new Error().stack });
```

**결과:** 1847개 테스트 모두 통과, 버그 재현 불가능

---

## 핵심 통찰

네 레이어 모두 필요했다. 테스트 중 각 레이어가 다른 것이 놓친 버그를 잡았다:

- 다른 코드 경로가 진입점 검증 우회
- Mock이 비즈니스 로직 체크 우회
- 다른 플랫폼의 엣지 케이스에 환경 가드 필요
- 디버그 로깅이 구조적 오용 식별

**하나의 검증 지점에서 멈추지 않는다.** 모든 레이어에 체크를 추가한다.

---

## 체크리스트

버그 수정 시:

- [ ] Layer 1: 진입점에 입력 검증 추가했는가?
- [ ] Layer 2: 비즈니스 로직에 도메인 검증 추가했는가?
- [ ] Layer 3: 필요 시 환경별 가드 추가했는가?
- [ ] Layer 4: 디버깅을 위한 로깅 추가했는가?
- [ ] 각 레이어가 다른 우회 시나리오를 잡는지 테스트했는가?

---

## Python 예시

```python
# Layer 1: Entry Point
def create_project(name: str, working_dir: str) -> Project:
    if not working_dir or not working_dir.strip():
        raise ValueError("working_dir cannot be empty")
    if not os.path.exists(working_dir):
        raise FileNotFoundError(f"working_dir does not exist: {working_dir}")
    # ...

# Layer 2: Business Logic
class WorkspaceManager:
    def create_workspace(self, project_dir: str) -> Workspace:
        if not project_dir:
            raise ValueError("project_dir required for workspace")
        # ...

# Layer 3: Environment Guard
def git_init(directory: str) -> None:
    if os.environ.get("TESTING") == "true":
        tmp_dir = tempfile.gettempdir()
        if not os.path.abspath(directory).startswith(tmp_dir):
            raise RuntimeError(f"Refusing git init outside temp in tests: {directory}")
    # ...

# Layer 4: Debug Instrumentation
import traceback
logger.debug("About to git init", extra={
    "directory": directory,
    "cwd": os.getcwd(),
    "stack": traceback.format_stack(),
})
```
