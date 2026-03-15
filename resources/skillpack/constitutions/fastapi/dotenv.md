# FastAPI .env 파일 로드 규칙

> **핵심**: Python/FastAPI는 .env 파일을 자동으로 로드하지 않음. 반드시 명시적 로드 필요!

---

## 문제 상황

```
프론트엔드에서 API 호출 → CORS 에러 발생
  ↓
실제 원인: 백엔드에서 환경 변수를 찾지 못해 500 에러
  ↓
에러 발생으로 CORS 헤더도 반환되지 않음
  ↓
개발자는 CORS 문제로 착각
```

**함정**: CORS 에러처럼 보이지만 실제로는 환경 변수 누락 문제!

---

## 프레임워크별 .env 로드 방식

| 프레임워크 | .env 자동 로드 | 비고 |
|------------|----------------|------|
| Node.js (Vite) | ✅ 자동 | `.env`, `.env.local` 등 |
| SvelteKit | ✅ 자동 | `$env/static/private` |
| Next.js | ✅ 자동 | `NEXT_PUBLIC_*` 접두사 |
| **Python (FastAPI)** | ❌ **수동** | `python-dotenv` 필요 |
| Django | ❌ 수동 | `django-environ` 권장 |

---

## 필수 규칙 (MUST)

### 1. python-dotenv 설치

```bash
pip install python-dotenv
# 또는 requirements.txt에 추가
python-dotenv>=1.0.0
```

### 2. main.py 최상단에서 로드

```python
# main.py
from dotenv import load_dotenv
from pathlib import Path

# 앱 초기화 전에 .env 로드 (최상단!)
env_path = Path(__file__).parent.parent / ".env"  # 프로젝트 루트
load_dotenv(env_path)

# 이후 FastAPI 앱 초기화
from fastapi import FastAPI
app = FastAPI()
```

### 3. 환경 변수 검증

```python
import os

# 필수 환경 변수 검증
required_vars = ["DATABASE_URL", "SECRET_KEY", "API_KEY"]
missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    raise RuntimeError(f"Missing required environment variables: {missing}")
```

---

## 권장 패턴: Pydantic Settings

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    api_key: str
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# 사용
from app.core.config import get_settings
settings = get_settings()
print(settings.api_key)
```

**장점**:
- 타입 검증 자동
- 누락 시 명확한 에러 메시지
- `.env` 파일 경로 설정 가능

---

## 금지 패턴 (NEVER)

```python
# ❌ .env 로드 없이 os.getenv 사용
api_key = os.getenv("API_KEY")  # None 반환 가능!

# ❌ 기본값으로 빈 문자열 사용
api_key = os.getenv("API_KEY", "")  # 빈 문자열로 API 호출 시도

# ❌ main.py가 아닌 곳에서 load_dotenv
# (import 순서에 따라 로드 전에 환경 변수 참조 가능)
```

---

## 올바른 패턴

```python
# ✅ main.py 최상단에서 로드
from dotenv import load_dotenv
load_dotenv()

# ✅ 환경 변수 누락 시 명확한 에러
api_key = os.getenv("API_KEY")
if not api_key:
    raise ValueError("API_KEY environment variable is required")

# ✅ Pydantic Settings 사용 (권장)
from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    api_key: str  # 필수, 없으면 ValidationError
    class Config:
        env_file = ".env"
```

---

## 디버깅 체크리스트

CORS 에러가 발생했을 때:

- [ ] 실제로 CORS 문제인가? (Network 탭에서 응답 코드 확인)
- [ ] 500 에러라면 백엔드 로그 확인
- [ ] `.env` 파일이 프로젝트 루트에 존재하는가?
- [ ] `load_dotenv()`가 `main.py` 최상단에서 호출되는가?
- [ ] 환경 변수 이름에 오타가 없는가?

---

## 프로젝트 구조 예시

```
project/
├── .env                    # 환경 변수 파일
├── backend/
│   └── app/
│       ├── main.py         # load_dotenv() 호출
│       ├── core/
│       │   └── config.py   # Settings 클래스
│       └── services/
│           └── api_service.py  # os.getenv() 사용
└── frontend/
    └── ...
```

```python
# backend/app/main.py
from dotenv import load_dotenv
from pathlib import Path

# 프로젝트 루트의 .env 로드
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

from fastapi import FastAPI
# ... 나머지 코드
```

---

## 관련 문서

- [python-dotenv 공식 문서](https://pypi.org/project/python-dotenv/)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [FastAPI Settings 가이드](https://fastapi.tiangolo.com/advanced/settings/)
