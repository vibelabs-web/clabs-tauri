# FastAPI Dependencies 헌법

> Dependency Injection 필수 규칙
> **테스트 가능하고 일관된 의존성 관리**

---

## 필수 규칙 (MUST)

### 1. DB 세션은 의존성으로만 주입

```python
# core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

```python
# api/products.py
from fastapi import Depends
from sqlalchemy.orm import Session
from core.database import get_db

@router.get("/products")
async def list_products(db: Session = Depends(get_db)):
    # db 사용
    pass
```

### 2. 공통 의존성은 core/deps.py에 집중

```python
# core/deps.py
from fastapi import Depends, Query
from sqlalchemy.orm import Session
from core.database import get_db

# DB 세션
def get_db() -> Session:
    # ...

# 인증
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # ...

# 페이지네이션
def get_pagination(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
) -> dict:
    return {"skip": (page - 1) * limit, "limit": limit}

# 정렬
def get_sorting(
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", regex="^(asc|desc)$")
) -> dict:
    return {"sort_by": sort_by, "sort_order": sort_order}
```

### 3. 서비스 레이어 의존성 주입

```python
# services/product.py
from sqlalchemy.orm import Session
from models.product import Product
from schemas.product import ProductCreate

class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def list(self, skip: int = 0, limit: int = 20):
        return self.db.query(Product).offset(skip).limit(limit).all()

    def create(self, data: ProductCreate, user_id: int) -> Product:
        product = Product(**data.dict(), user_id=user_id)
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

# core/deps.py
def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db)

# api/products.py
@router.get("/products")
async def list_products(
    service: ProductService = Depends(get_product_service),
    pagination: dict = Depends(get_pagination)
):
    return service.list(**pagination)
```

---

## 금지 패턴 (NEVER)

### 1. 전역 DB 세션 금지

```python
# ❌ 금지 - 전역 세션
db = SessionLocal()

@router.get("/products")
async def list_products():
    return db.query(Product).all()  # 스레드 안전하지 않음!

# ✅ 올바름 - 요청마다 새 세션
@router.get("/products")
async def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()
```

### 2. 엔드포인트에서 직접 세션 생성 금지

```python
# ❌ 금지
@router.get("/products")
async def list_products():
    db = SessionLocal()  # 엔드포인트에서 직접 생성
    try:
        return db.query(Product).all()
    finally:
        db.close()

# ✅ 올바름 - Depends 사용
@router.get("/products")
async def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()
```

### 3. 의존성 내에서 예외 삼키기 금지

```python
# ❌ 금지 - 예외 삼키기
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        pass  # 예외 삼킴!
    finally:
        db.close()

# ✅ 올바름 - 예외 전파
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # 예외는 자동 전파
```

### 4. 순환 의존성 금지

```python
# ❌ 금지 - 순환 의존성
# core/deps.py
from services.user import UserService  # UserService가 deps를 import

# services/user.py
from core.deps import get_db  # deps가 UserService를 import

# ✅ 올바름 - 의존성 방향 정리
# core/deps.py (다른 모듈 import 최소화)
# services/ (deps만 import)
```

---

## 올바른 패턴

### 페이지네이션 + 필터링 조합

```python
# core/deps.py
from fastapi import Query
from typing import Optional

class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="페이지 번호"),
        limit: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    ):
        self.skip = (page - 1) * limit
        self.limit = limit

class ProductFilterParams:
    def __init__(
        self,
        category_id: Optional[int] = Query(None, description="카테고리 ID"),
        min_price: Optional[float] = Query(None, ge=0, description="최소 가격"),
        max_price: Optional[float] = Query(None, ge=0, description="최대 가격"),
        search: Optional[str] = Query(None, min_length=1, description="검색어"),
    ):
        self.category_id = category_id
        self.min_price = min_price
        self.max_price = max_price
        self.search = search

# api/products.py
@router.get("/products")
async def list_products(
    pagination: PaginationParams = Depends(),
    filters: ProductFilterParams = Depends(),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if filters.category_id:
        query = query.filter(Product.category_id == filters.category_id)
    if filters.min_price:
        query = query.filter(Product.price >= filters.min_price)
    if filters.max_price:
        query = query.filter(Product.price <= filters.max_price)
    if filters.search:
        query = query.filter(Product.name.ilike(f"%{filters.search}%"))

    total = query.count()
    items = query.offset(pagination.skip).limit(pagination.limit).all()

    return {
        "items": items,
        "total": total,
        "page": (pagination.skip // pagination.limit) + 1,
        "pages": (total + pagination.limit - 1) // pagination.limit,
    }
```

### 리소스 소유권 검증

```python
# core/deps.py
from fastapi import HTTPException, status

def get_owned_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    if product.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your product"
        )

    return product

# api/products.py
@router.put("/products/{product_id}")
async def update_product(
    data: ProductUpdate,
    product: Product = Depends(get_owned_product),  # 소유권 검증 자동!
    db: Session = Depends(get_db),
):
    for key, value in data.dict(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    return product

@router.delete("/products/{product_id}")
async def delete_product(
    product: Product = Depends(get_owned_product),  # 재사용!
    db: Session = Depends(get_db),
):
    db.delete(product)
    db.commit()
    return {"status": "deleted"}
```

### 캐싱 의존성

```python
# core/deps.py
from functools import lru_cache
from core.config import Settings

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# 사용
@router.get("/info")
async def get_info(settings: Settings = Depends(get_settings)):
    return {"app_name": settings.APP_NAME}
```

---

## 테스트에서 의존성 오버라이드

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from core.database import get_db, Base

# 테스트용 DB
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

# tests/test_products.py
def test_list_products(client, auth_headers):
    response = client.get("/api/products", headers=auth_headers)
    assert response.status_code == 200
```

---

## 위반 감지 방법

```bash
# 1. 전역 SessionLocal 사용 검사
grep -rn "SessionLocal()" --include="*.py" . | grep -v "def get_db"

# 2. Depends 없이 db 사용 검사
grep -rn "db:" --include="*.py" api/ | grep -v "Depends(get_db)"

# 3. 순환 import 검사
python -c "from core.deps import *"  # 에러 발생 시 순환 의존성
```

---

## 체크리스트

- [ ] 모든 DB 세션이 `Depends(get_db)`로 주입됨
- [ ] 공통 의존성이 `core/deps.py`에 집중됨
- [ ] 비즈니스 로직이 서비스 레이어에 분리됨
- [ ] 의존성에서 예외를 삼키지 않음
- [ ] 순환 의존성 없음
- [ ] 테스트에서 의존성 오버라이드 가능
