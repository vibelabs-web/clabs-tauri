# Root Cause Tracing (근본 원인 추적)

## 개요

버그는 종종 콜 스택 깊숙이 나타난다 (잘못된 디렉토리에서 git init, 잘못된 위치에 파일 생성, 잘못된 경로로 DB 열기). 본능적으로 에러가 나타나는 곳에서 수정하려 하지만, 그건 증상 치료다.

**핵심 원칙:** 원래 트리거를 찾을 때까지 콜 체인을 역추적한 다음, 소스에서 수정한다.

---

## 언제 사용하는가

```
버그가 스택 깊숙이?
    ↓ yes
역추적 가능?
    ↓ yes
원래 트리거까지 추적
    ↓
더 좋음: defense-in-depth도 추가
```

**사용할 때:**
- 에러가 실행 깊숙이 발생 (진입점 아님)
- 스택 트레이스가 긴 콜 체인 보여줌
- 잘못된 데이터의 출처가 불분명
- 어떤 테스트/코드가 문제를 트리거하는지 찾아야 함

---

## 추적 프로세스

### 1. 증상 관찰

```
Error: git init failed in /Users/user/project/packages/core
```

### 2. 직접적 원인 찾기

**이 코드가 직접 이걸 일으키나?**

```typescript
await execFileAsync('git', ['init'], { cwd: projectDir });
```

### 3. 묻기: 이걸 뭐가 호출했나?

```typescript
WorktreeManager.createSessionWorktree(projectDir, sessionId)
  → called by Session.initializeWorkspace()
  → called by Session.create()
  → called by test at Project.create()
```

### 4. 계속 위로 추적

**어떤 값이 전달됐나?**
- `projectDir = ''` (빈 문자열!)
- `cwd`로 빈 문자열은 `process.cwd()`로 해석
- 그게 소스 코드 디렉토리!

### 5. 원래 트리거 찾기

**빈 문자열은 어디서 왔나?**

```typescript
const context = setupCoreTest(); // Returns { tempDir: '' }
Project.create('name', context.tempDir); // beforeEach 전에 접근!
```

---

## 스택 트레이스 추가하기

수동 추적이 안 될 때, 계측 추가:

```typescript
// 문제 되는 작업 전
async function gitInit(directory: string) {
  const stack = new Error().stack;
  console.error('DEBUG git init:', {
    directory,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack,
  });

  await execFileAsync('git', ['init'], { cwd: directory });
}
```

**중요:** 테스트에서 `console.error()` 사용 (logger 아님 - 안 보일 수 있음)

**실행하고 캡처:**

```bash
npm test 2>&1 | grep 'DEBUG git init'
```

**스택 트레이스 분석:**
- 테스트 파일 이름 찾기
- 호출을 트리거하는 라인 번호 찾기
- 패턴 식별 (같은 테스트? 같은 파라미터?)

---

## 어떤 테스트가 오염을 일으키는지 찾기

테스트 중 뭔가 나타나는데 어떤 테스트인지 모를 때:

**Bisection 방법:**

```bash
# 테스트를 하나씩 실행하고 오염자에서 멈춤
for test in $(find . -name "*.test.ts"); do
  npm test -- "$test"
  if [ -d ".git" ]; then
    echo "Polluter found: $test"
    break
  fi
done
```

---

## 실제 예시: 빈 projectDir

**증상:** `packages/core/`(소스 코드)에 `.git` 생성됨

**추적 체인:**
1. `git init`이 `process.cwd()`에서 실행 ← 빈 cwd 파라미터
2. WorktreeManager가 빈 projectDir로 호출됨
3. Session.create()가 빈 문자열 전달
4. 테스트가 beforeEach 전에 `context.tempDir` 접근
5. setupCoreTest()가 초기에 `{ tempDir: '' }` 반환

**근본 원인:** 빈 값을 접근하는 최상위 변수 초기화

**수정:** tempDir을 beforeEach 전 접근 시 throw하는 getter로 만듦

**defense-in-depth도 추가:**
- Layer 1: Project.create()가 디렉토리 검증
- Layer 2: WorkspaceManager가 빈 값 아닌지 검증
- Layer 3: NODE_ENV 가드가 테스트 중 tmpdir 외부 git init 거부
- Layer 4: git init 전 스택 트레이스 로깅

---

## 핵심 원칙

```
직접적 원인 발견
    ↓
한 단계 위로 추적 가능?
    ↓ yes
역추적
    ↓
이게 소스인가?
    ↓ no → 계속 역추적
    ↓ yes
소스에서 수정
    ↓
각 레이어에 검증 추가
    ↓
버그 불가능해짐
```

**절대 에러가 나타나는 곳만 수정하지 않는다.** 원래 트리거를 찾기 위해 역추적한다.

---

## 스택 트레이스 팁

- **테스트에서:** `console.error()` 사용 (logger 아님 - 억제될 수 있음)
- **작업 전:** 실패 후가 아닌 위험한 작업 전에 로그
- **컨텍스트 포함:** 디렉토리, cwd, 환경 변수, 타임스탬프
- **스택 캡처:** `new Error().stack`이 완전한 콜 체인 보여줌

---

## 실제 영향

디버깅 세션에서:
- 5단계 추적으로 근본 원인 발견
- 소스에서 수정 (getter 검증)
- 4개 레이어 방어 추가
- 1847개 테스트 통과, 오염 제로
