---
name: guardrails
description: 코드 생성 전후 안전성 검증 자동화. 위험 패턴 차단, 보안 검사.
trigger: 코드 작성/수정 시 자동 검증
---

# Guardrails Skill

> 코드 생성 전후 안전성 검증 자동화

## 개요

Guardrails 패턴을 적용하여 코드 생성 전 입력을 검증하고, 생성 후 출력을 검사하여 안전한 코드만 제공합니다.

```
┌─────────────────────────────────────────────────────────┐
│                    Guardrails Flow                      │
│                                                         │
│  [입력] → [입력 가드] → [코드 생성] → [출력 가드] → [결과]  │
│              │                           │              │
│              ↓                           ↓              │
│          거부/수정                    수정/경고           │
└─────────────────────────────────────────────────────────┘
```

---

## 가드 레일 종류

### 1. 입력 가드 (Pre-Generation)

코드 생성 전 요청 검증:

| 체크 항목 | 설명 | 액션 |
|----------|------|------|
| 위험한 명령어 요청 | `rm -rf /`, `DROP DATABASE` | 거부 |
| 민감 정보 포함 | API 키, 비밀번호 하드코딩 요청 | 환경변수로 대체 |
| 범위 초과 요청 | 프로젝트 외부 파일 수정 | 경고 후 확인 |
| 비윤리적 코드 | 악성코드, 스크래핑 우회 | 거부 |

### 2. 출력 가드 (Post-Generation)

생성된 코드 검증:

| 체크 항목 | 설명 | 액션 |
|----------|------|------|
| 보안 취약점 | SQL Injection, XSS | 자동 수정 |
| 하드코딩된 비밀 | 토큰, 비밀번호 | 환경변수로 교체 |
| 위험한 패턴 | eval(), exec(), shell injection | 경고 + 대안 제시 |
| 라이선스 위반 | GPL 코드 복사 | 경고 |

### 3. 행동 가드 (Behavioral)

에이전트 행동 제한:

| 제한 | 설명 |
|------|------|
| 파일 범위 | 프로젝트 디렉토리 내부만 수정 |
| 실행 범위 | 명시적 허용 없이 위험 명령 실행 금지 |
| 데이터 범위 | 민감 데이터 로깅/전송 금지 |

---

## 입력 가드 규칙

### 거부 패턴 (Hard Block)

다음 요청은 즉시 거부:

```python
BLOCKED_PATTERNS = [
    # 시스템 파괴
    r"rm\s+-rf\s+/",
    r":(){ :|:& };:",  # fork bomb
    r"dd\s+if=/dev/zero",

    # 데이터베이스 파괴
    r"DROP\s+(DATABASE|TABLE)",
    r"TRUNCATE\s+TABLE",
    r"DELETE\s+FROM\s+\w+\s*;",  # WHERE 없는 DELETE

    # 자격 증명 탈취
    r"curl.*(-d|--data).*password",
    r"wget.*credentials",
]
```

### 수정 패턴 (Soft Block)

다음 요청은 수정 후 진행:

```markdown
요청: "API_KEY를 'sk-1234abcd'로 설정해줘"
수정: "API_KEY를 환경변수에서 읽도록 설정합니다"

요청: "비밀번호를 admin123으로 하드코딩해줘"
수정: "비밀번호를 환경변수 또는 시크릿 매니저에서 읽도록 설정합니다"
```

---

## 출력 가드 규칙

### 보안 취약점 자동 수정

#### SQL Injection 방지

```python
# ❌ 위험한 코드 (감지)
query = f"SELECT * FROM users WHERE id = {user_id}"

# ✅ 자동 수정
query = "SELECT * FROM users WHERE id = :id"
result = db.execute(query, {"id": user_id})
```

#### XSS 방지

```typescript
// ❌ 위험한 코드 (감지)
element.innerHTML = userInput;

// ✅ 자동 수정
element.textContent = userInput;
// 또는 DOMPurify 사용
element.innerHTML = DOMPurify.sanitize(userInput);
```

#### Command Injection 방지

```python
# ❌ 위험한 코드 (감지)
os.system(f"echo {user_input}")

# ✅ 자동 수정
import subprocess
subprocess.run(["echo", user_input], check=True)
```

### 민감 정보 검출

생성된 코드에서 다음 패턴 검출:

```python
SECRET_PATTERNS = [
    r"(?i)(api[_-]?key|apikey)\s*[=:]\s*['\"][a-zA-Z0-9]{20,}['\"]",
    r"(?i)(secret|password|passwd|pwd)\s*[=:]\s*['\"].+['\"]",
    r"(?i)(token|bearer)\s*[=:]\s*['\"][a-zA-Z0-9_-]{20,}['\"]",
    r"-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----",
    r"(?i)aws[_-]?(access[_-]?key|secret)",
]
```

검출 시 자동 수정:

```python
# ❌ 감지
API_KEY = "sk-1234567890abcdef"

# ✅ 자동 수정
import os
API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY environment variable is required")
```

---

## 행동 가드 규칙

### 파일 시스템 제한

```python
ALLOWED_PATHS = [
    "{project_root}/**",  # 프로젝트 내부
    "/tmp/**",            # 임시 파일
]

BLOCKED_PATHS = [
    "~/.ssh/**",          # SSH 키
    "~/.aws/**",          # AWS 자격증명
    "/etc/**",            # 시스템 설정
    "~/.env",             # 환경 변수
]
```

### 명령어 실행 제한

```python
# 허용된 명령어 (화이트리스트)
ALLOWED_COMMANDS = [
    "npm", "yarn", "pnpm", "bun",     # 패키지 매니저
    "python", "pip", "poetry", "uv",  # Python
    "git",                             # 버전 관리
    "docker", "docker-compose",        # 컨테이너
    "pytest", "vitest", "jest",        # 테스트
]

# 제한된 명령어 (확인 필요)
RESTRICTED_COMMANDS = [
    "curl", "wget",        # 네트워크 요청
    "sudo",                # 권한 상승
    "chmod", "chown",      # 권한 변경
]
```

---

## 검증 결과 포맷

### 통과 시

```markdown
✅ Guardrails 검증 통과

입력 가드: 통과
출력 가드: 통과
- 보안 취약점: 없음
- 민감 정보: 없음
- 위험 패턴: 없음
```

### 경고 시

```markdown
⚠️ Guardrails 경고

출력 가드에서 다음 이슈 발견:

1. [MEDIUM] 하드코딩된 타임아웃 값
   - 위치: src/api/client.ts:45
   - 권장: 환경변수 또는 설정 파일 사용

2. [LOW] console.log 발견
   - 위치: src/utils/debug.ts:12
   - 권장: 프로덕션에서 제거 또는 로깅 라이브러리 사용

코드 생성은 완료되었으나 위 이슈를 검토해주세요.
```

### 차단 시

```markdown
🚫 Guardrails 차단

입력 가드에서 차단됨:

사유: 위험한 명령어 패턴 감지
- 패턴: "rm -rf /"
- 분류: 시스템 파괴 명령

이 요청은 처리할 수 없습니다.
```

---

## Security Specialist 연동

Guardrails는 `security-specialist`와 연동됩니다:

```
Guardrails (빠른 패턴 매칭)
    ↓
기본 검사 통과
    ↓
Security Specialist (심층 분석)
    ↓
OWASP TOP 10 검사
의존성 취약점 검사
```

### 역할 분담

| 검사 | Guardrails | Security Specialist |
|------|------------|---------------------|
| 속도 | 즉시 (패턴 매칭) | 수 초 (심층 분석) |
| 범위 | 기본 패턴 | OWASP TOP 10 전체 |
| 실행 | 모든 코드 생성 시 | Phase 완료 시 |
| 자동 수정 | 지원 | 제안만 |

---

## 설정

### 프로젝트별 설정 (선택)

`.claude/guardrails.json`:

```json
{
  "inputGuards": {
    "enabled": true,
    "customBlockedPatterns": [
      "company_internal_api"
    ]
  },
  "outputGuards": {
    "enabled": true,
    "autoFix": true,
    "secretScanning": true,
    "allowedDomains": [
      "api.example.com",
      "cdn.example.com"
    ]
  },
  "behaviorGuards": {
    "enabled": true,
    "allowedPaths": [
      "./src/**",
      "./tests/**"
    ]
  }
}
```

---

## 자동 실행

Guardrails는 다음 상황에서 자동 실행:

1. **코드 생성 전**: 모든 에이전트의 코드 작성 요청
2. **코드 생성 후**: Edit, Write 도구 사용 시
3. **명령 실행 전**: Bash 도구 사용 시

---

## 우회 (비권장)

긴급 상황에서 가드레일 우회:

```
사용자: "--no-guardrails 플래그로 이 코드 실행해줘"

응답:
⚠️ Guardrails 우회 요청 감지

우회 시 다음 위험이 있습니다:
- 보안 취약점이 포함된 코드 생성 가능
- 시스템 손상 명령 실행 가능

정말 우회하시겠습니까? [명시적 확인 필요]
```

---

## 참고

- 기본 보안: Guardrails (빠른 패턴 매칭)
- 심층 보안: Security Specialist (OWASP TOP 10)
- 실시간 적용: 모든 코드 생성에 자동 적용
