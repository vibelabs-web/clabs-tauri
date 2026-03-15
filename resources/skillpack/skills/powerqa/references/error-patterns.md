# 에러 패턴 매핑

## 일반 에러 패턴

### Import / Module 에러

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `Cannot find module` | 모듈 미설치 또는 경로 오류 | `npm install` 또는 import 경로 수정 |
| `ModuleNotFoundError` | Python 모듈 미설치 | `pip install` 또는 import 수정 |
| `import cycle detected` | 순환 의존성 | 의존성 구조 리팩토링 |

### Type 에러

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `Property 'x' does not exist` | 타입 정의 누락 | interface/type 확장 |
| `Type 'X' is not assignable` | 타입 불일치 | 타입 캐스팅 또는 타입 수정 |
| `Object is possibly 'undefined'` | null 체크 누락 | optional chaining 또는 null 체크 |
| `Argument of type 'X' is not assignable` | 함수 인자 타입 불일치 | 인자 타입 수정 |

### Runtime 에러

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `TypeError: Cannot read property 'x' of undefined` | null/undefined 접근 | null 체크 추가 |
| `ReferenceError: x is not defined` | 변수 미선언 | 변수 선언 또는 import |
| `SyntaxError` | 문법 오류 | 문법 수정 |

---

## 테스트 에러 패턴

### Jest / Vitest

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `Expected: X, Received: Y` | assertion 실패 | 로직 또는 기대값 수정 |
| `Timeout - Async callback was not invoked` | 비동기 타임아웃 | async/await 확인, 타임아웃 증가 |
| `Cannot find module` in test | mock 설정 누락 | jest.mock() 추가 |

### Pytest

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `AssertionError` | assertion 실패 | 로직 또는 기대값 수정 |
| `fixture 'x' not found` | fixture 미정의 | fixture 정의 또는 import |
| `E       Failed: DID NOT RAISE` | 예외 미발생 | 예외 발생 로직 확인 |

---

## 빌드 에러 패턴

### TypeScript (tsc)

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `TS2307: Cannot find module` | 모듈 경로 오류 | paths 설정 또는 경로 수정 |
| `TS2345: Argument of type` | 타입 불일치 | 타입 수정 |
| `TS2339: Property does not exist` | 프로퍼티 미존재 | 타입 확장 |
| `TS7006: Parameter implicitly has 'any' type` | 타입 미지정 | 명시적 타입 추가 |

### Python (build)

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `SyntaxError` | 문법 오류 | 문법 수정 |
| `NameError` | 미정의 이름 | import 또는 정의 추가 |
| `IndentationError` | 들여쓰기 오류 | 들여쓰기 수정 |

### Rust (cargo)

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `error[E0433]: failed to resolve` | 모듈 경로 오류 | use 경로 수정 |
| `error[E0308]: mismatched types` | 타입 불일치 | 타입 변환 |
| `error[E0382]: borrow of moved value` | 소유권 이동 후 사용 | clone() 또는 참조 사용 |

---

## 린트 에러 패턴

### ESLint

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `no-unused-vars` | 미사용 변수 | 변수 제거 또는 사용 |
| `@typescript-eslint/no-explicit-any` | any 타입 사용 | 구체적 타입 지정 |
| `react-hooks/exhaustive-deps` | deps 배열 누락 | 의존성 추가 |

### Ruff / Flake8

| 패턴 | 원인 | 수정 방안 |
|------|------|----------|
| `F401: imported but unused` | 미사용 import | import 제거 |
| `E501: line too long` | 라인 길이 초과 | 라인 분리 |
| `F841: local variable assigned but never used` | 미사용 변수 | 변수 제거 |

---

## 환경 에러 (자동 수정 불가)

### 수동 개입 필요

| 패턴 | 원인 | 사용자 조치 |
|------|------|-----------|
| `ECONNREFUSED` | 서비스 연결 실패 | 서비스 시작, 포트 확인 |
| `ENOENT: no such file or directory` | 파일 미존재 | 파일 생성 또는 경로 확인 |
| `EACCES: permission denied` | 권한 부족 | 권한 설정 |
| `connection refused` | DB/서비스 미실행 | Docker/서비스 시작 |
| `ENOMEM` | 메모리 부족 | 메모리 확보 |

---

## 시그니처 추출

### 에러 시그니처 생성

동일 실패 감지를 위한 시그니처 추출:

```python
def extract_signature(error_output):
    """에러 출력에서 핵심 시그니처 추출"""

    # 1. 파일명:라인번호 추출
    file_line = re.search(r'([^/\s]+\.\w+):(\d+)', error_output)

    # 2. 에러 타입 추출
    error_type = re.search(r'(TypeError|ReferenceError|SyntaxError|Error)', error_output)

    # 3. 핵심 메시지 추출 (첫 50자)
    message = error_output[:50].strip()

    return f"{file_line}:{error_type}:{hash(message)}"
```

### 유사도 비교

```python
def is_same_failure(sig1, sig2):
    """두 시그니처가 동일 실패인지 판별"""

    parts1 = sig1.split(':')
    parts2 = sig2.split(':')

    # 파일명과 에러 타입이 같으면 동일 실패로 간주
    return parts1[0] == parts2[0] and parts1[1] == parts2[1]
```
