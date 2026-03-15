# Guardrails 차단 패턴 목록

> 입력/출력 가드에서 감지하는 위험 패턴

## 입력 가드 - 즉시 차단

### 시스템 파괴 명령

```regex
# 파일 시스템 파괴
rm\s+-rf\s+/
rm\s+-rf\s+~
rm\s+-rf\s+\*

# Fork bomb
:(){ :|:& };:

# 디스크 파괴
dd\s+if=/dev/(zero|random|urandom)\s+of=/dev/

# 시스템 종료
shutdown\s+-h
init\s+0
halt
poweroff
```

### 데이터베이스 파괴

```regex
# 전체 삭제
DROP\s+DATABASE
DROP\s+TABLE\s+\*
TRUNCATE\s+TABLE

# WHERE 없는 DELETE/UPDATE
DELETE\s+FROM\s+\w+\s*;
UPDATE\s+\w+\s+SET\s+.*\s*;

# 권한 조작
GRANT\s+ALL
REVOKE\s+ALL
```

### 자격 증명 탈취

```regex
# 네트워크 전송
curl.*(-d|--data).*(password|secret|token|api.?key)
wget.*credentials
nc\s+-e

# 파일 접근
cat\s+~/.ssh/
cat\s+~/.aws/
cat\s+/etc/passwd
cat\s+/etc/shadow
```

---

## 입력 가드 - 수정 후 진행

### 하드코딩 요청

```regex
# API 키
(api[_-]?key|apikey)\s*[=:]\s*['\"][a-zA-Z0-9]{16,}

# 비밀번호
(password|passwd|pwd|secret)\s*[=:]\s*['\"].{4,}

# 토큰
(token|bearer|jwt)\s*[=:]\s*['\"][a-zA-Z0-9._-]{20,}

# 수정 방법
→ 환경변수: os.environ.get("API_KEY")
→ 시크릿 매니저: secrets.get("api_key")
```

### 안전하지 않은 프로토콜

```regex
# HTTP 사용
http://(?!localhost|127\.0\.0\.1)

# 수정 방법
→ HTTPS 사용: https://
```

---

## 출력 가드 - 보안 취약점

### SQL Injection (CWE-89)

```python
# 감지 패턴
f"SELECT.*{.*}"
f"INSERT.*{.*}"
f"UPDATE.*{.*}"
f"DELETE.*{.*}"
"SELECT.*" \+ .*
"SELECT.*" % .*

# 수정 방법
→ 파라미터화된 쿼리 사용
→ ORM 사용 (SQLAlchemy, Prisma 등)
```

### XSS (CWE-79)

```javascript
// 감지 패턴
\.innerHTML\s*=
document\.write\(
eval\(.*\)
new Function\(

// 수정 방법
→ textContent 사용
→ DOMPurify.sanitize() 사용
→ React/Vue의 자동 이스케이핑 활용
```

### Command Injection (CWE-78)

```python
# 감지 패턴
os\.system\(f?['\"].*\{
subprocess\.call\(.*shell=True
exec\(.*input
eval\(.*input

# 수정 방법
→ subprocess.run(["cmd", arg], shell=False)
→ shlex.quote() 사용
```

### Path Traversal (CWE-22)

```python
# 감지 패턴
open\(.*\+.*\)
open\(f?['\"].*\{
Path\(.*\+.*\)

# 수정 방법
→ os.path.basename() 사용
→ pathlib.Path.resolve() 후 검증
```

### Insecure Deserialization (CWE-502)

```python
# 감지 패턴
pickle\.loads?\(
yaml\.load\((?!.*Loader)
marshal\.loads?\(

# 수정 방법
→ json.loads() 사용
→ yaml.safe_load() 사용
```

---

## 출력 가드 - 민감 정보

### API 키 패턴

```regex
# AWS
AKIA[0-9A-Z]{16}
aws[_-]?(access[_-]?key|secret)[_-]?

# Google
AIza[0-9A-Za-z_-]{35}
[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com

# GitHub
gh[pousr]_[A-Za-z0-9_]{36,}
github_pat_[A-Za-z0-9_]{22,}

# Stripe
sk_live_[0-9a-zA-Z]{24,}
pk_live_[0-9a-zA-Z]{24,}

# OpenAI
sk-[A-Za-z0-9]{48}

# Generic
['\"]?[a-zA-Z_]*(?:api[_-]?key|secret|token|password)['\"]?\s*[:=]\s*['\"][^'\"]{8,}['\"]
```

### Private Key 패턴

```regex
-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----
-----BEGIN PGP PRIVATE KEY BLOCK-----
```

### 데이터베이스 연결 문자열

```regex
# PostgreSQL
postgres(ql)?://[^:]+:[^@]+@
# MySQL
mysql://[^:]+:[^@]+@
# MongoDB
mongodb(\+srv)?://[^:]+:[^@]+@
# Redis
redis://:[^@]+@
```

---

## 출력 가드 - 위험 패턴

### eval/exec 계열

```javascript
// JavaScript
eval\(
new Function\(
setTimeout\(['\"]
setInterval\(['\"]
```

```python
# Python
eval\(
exec\(
compile\(
__import__\(
```

### 디버그/개발용 코드

```regex
# 콘솔 출력
console\.(log|debug|info)
print\(
System\.out\.print

# 디버거
debugger;
import pdb
breakpoint\(\)

# TODO/FIXME
# TODO:
# FIXME:
# HACK:
```

---

## 행동 가드 - 경로 제한

### 차단 경로

```
~/.ssh/
~/.aws/
~/.config/
~/.gnupg/
/etc/passwd
/etc/shadow
/etc/sudoers
/root/
C:\Windows\System32\
C:\Users\*\AppData\
```

### 허용 경로

```
{project_root}/**
/tmp/**
./node_modules/**  (읽기 전용)
./venv/**  (읽기 전용)
```

---

## 심각도 레벨

| 레벨 | 설명 | 액션 |
|------|------|------|
| CRITICAL | 시스템 파괴, 데이터 손실 | 즉시 차단 |
| HIGH | 보안 취약점, 민감정보 노출 | 차단 + 수정 제안 |
| MEDIUM | 잠재적 위험, 모범 사례 위반 | 경고 + 자동 수정 |
| LOW | 코드 품질 이슈 | 경고만 |

---

## 커스텀 패턴 추가

`.claude/guardrails.json`:

```json
{
  "customPatterns": {
    "block": [
      {
        "name": "internal-api-key",
        "pattern": "INTERNAL_API_[A-Z0-9]{32}",
        "severity": "CRITICAL",
        "message": "Internal API key detected"
      }
    ],
    "warn": [
      {
        "name": "deprecated-function",
        "pattern": "legacyFunction\\(",
        "severity": "LOW",
        "message": "Deprecated function usage"
      }
    ]
  }
}
```
