# FastAPI Auth 헌법

> JWT + OAuth2 인증 필수 규칙
> **일관된 인증 패턴으로 보안 취약점 방지**

---

## 필수 규칙 (MUST)

### 1. 단일 인증 의존성 사용

```python
# core/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user
```

### 2. 모든 보호된 엔드포인트에 동일한 의존성

```python
# api/products.py
from fastapi import APIRouter, Depends
from core.deps import get_current_active_user
from models.user import User

router = APIRouter()

@router.get("/products")
async def list_products(
    current_user: User = Depends(get_current_active_user)
):
    # current_user 사용
    pass

@router.post("/products")
async def create_product(
    data: ProductCreate,
    current_user: User = Depends(get_current_active_user)
):
    # 항상 같은 의존성
    pass
```

### 3. JWT 설정 규칙

```python
# core/config.py
from pydantic_settings import BaseSettings
from datetime import timedelta

class Settings(BaseSettings):
    SECRET_KEY: str  # 환경변수에서 로드
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = ".env"

settings = Settings()
```

```python
# core/security.py
from datetime import datetime, timedelta
from jose import jwt
from core.config import settings

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

---

## 금지 패턴 (NEVER)

### 1. 엔드포인트마다 다른 인증 방식 금지

```python
# ❌ 금지 - 엔드포인트마다 다른 방식
@router.get("/products")
async def list_products(token: str = Header(...)):  # 직접 Header 사용
    user = verify_token(token)
    pass

@router.post("/products")
async def create_product(
    current_user: User = Depends(get_current_user)  # 표준 의존성
):
    pass
```

### 2. SECRET_KEY 하드코딩 금지

```python
# ❌ 금지
SECRET_KEY = "my-secret-key-123"

# ✅ 올바름
SECRET_KEY = os.getenv("SECRET_KEY")
# 또는 pydantic Settings 사용
```

### 3. 토큰 검증 생략 금지

```python
# ❌ 금지 - 토큰 디코딩만 하고 검증 안 함
def get_user_from_token(token: str):
    payload = jwt.decode(token, options={"verify_signature": False})  # 위험!
    return payload.get("sub")

# ✅ 올바름 - 항상 서명 검증
def get_user_from_token(token: str):
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    return payload.get("sub")
```

### 4. 민감 정보 응답 노출 금지

```python
# ❌ 금지 - 비밀번호 해시 노출
@router.get("/users/me")
async def get_me(user: User = Depends(get_current_user)):
    return user  # hashed_password 포함!

# ✅ 올바름 - 응답 스키마 사용
@router.get("/users/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user  # UserResponse에 정의된 필드만 반환
```

---

## 올바른 패턴

### 로그인 엔드포인트

```python
# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core.deps import get_db
from core.security import create_access_token, create_refresh_token, verify_password
from models.user import User
from schemas.auth import Token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # 1. 사용자 조회
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 2. 비밀번호 검증
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 3. 토큰 생성
    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "refresh_token": create_refresh_token({"sub": str(user.id)}),
        "token_type": "bearer",
    }
```

### 토큰 갱신 엔드포인트

```python
@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # 토큰 타입 검증
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "refresh_token": create_refresh_token({"sub": str(user.id)}),
        "token_type": "bearer",
    }
```

### 역할 기반 접근 제어

```python
# core/deps.py
from enum import Enum
from typing import List

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

def require_roles(allowed_roles: List[UserRole]):
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# 사용
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    # admin만 접근 가능
    pass
```

---

## 테스트 패턴

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from core.security import create_access_token

@pytest.fixture
def auth_headers(test_user):
    token = create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}

# tests/test_products.py
def test_list_products_authenticated(client, auth_headers):
    response = client.get("/api/products", headers=auth_headers)
    assert response.status_code == 200

def test_list_products_unauthorized(client):
    response = client.get("/api/products")
    assert response.status_code == 401
```

---

## 위반 감지 방법

```bash
# 1. 하드코딩된 SECRET_KEY 검사
grep -rn "SECRET_KEY.*=" --include="*.py" . | grep -v "os.getenv\|settings\|Settings"

# 2. verify_signature=False 검사
grep -rn "verify_signature.*False" --include="*.py" .

# 3. 일관성 없는 인증 의존성 검사
grep -rn "def.*current_user" --include="*.py" . | wc -l
# 여러 개면 일관성 문제 가능성
```

---

## 체크리스트

- [ ] 단일 `get_current_user` 의존성 존재
- [ ] 모든 보호된 엔드포인트가 동일한 의존성 사용
- [ ] SECRET_KEY가 환경변수에서 로드됨
- [ ] 토큰 만료 시간 적절히 설정 (access: 30분, refresh: 7일)
- [ ] response_model로 민감 정보 필터링
- [ ] 테스트에서 인증/비인증 케이스 모두 커버
