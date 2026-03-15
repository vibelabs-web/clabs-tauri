# FastAPI API Design 헌법

> "백엔드 API는 화면에 종속되지 않는다"
> Resource-Oriented API Design으로 재사용성과 독립성 보장

---

## 왜 이 헌법이 필요한가?

### 실패 사례

| 실패 | 원인 | 올바른 패턴 |
|------|------|------------|
| `/api/screens/product-list` | 화면명 URL | `/api/products` |
| `price: "10,000원"` | 포맷된 응답 | `price: 10000` |
| `/api/home-page-data` | Aggregate 엔드포인트 | 개별 리소스 API |
| "장바구니에 추가할 수 없습니다" | 화면 전용 에러 | "insufficient_stock" |

---

## 필수 규칙 (MUST)

### 1. RESTful 엔드포인트

```python
# ✅ 올바름
@router.get("/api/products")
@router.get("/api/products/{product_id}")
@router.post("/api/products")
@router.put("/api/products/{product_id}")
@router.delete("/api/products/{product_id}")

# ❌ 잘못됨
@router.get("/api/getProductList")
@router.post("/api/addProduct")
```

### 2. 복수형 명사 리소스

```python
# ✅ 올바름
/api/products       # 상품 목록
/api/categories     # 카테고리 목록
/api/orders         # 주문 목록
/api/users          # 사용자 목록

# ❌ 잘못됨
/api/product        # 단수형
/api/productList    # camelCase + 동사
/api/getProducts    # 동사 시작
```

### 3. Raw 데이터 반환 (포맷팅 금지)

```python
# ✅ 올바름 - Raw 데이터
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "상품명",
    "price": 10000,           # 숫자
    "created_at": "2024-01-15T10:30:00Z"  # ISO 8601
}

# ❌ 잘못됨 - 포맷된 데이터
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "상품명",
    "price": "10,000원",      # 포맷된 문자열
    "created_at": "2024년 1월 15일"  # 로케일 포맷
}
```

### 4. 중첩 리소스 (2단계 이하)

```python
# ✅ 올바름 - 2단계 이하
/api/orders/{order_id}/items
/api/users/{user_id}/addresses
/api/products/{product_id}/reviews

# ❌ 잘못됨 - 3단계 이상
/api/users/{user_id}/orders/{order_id}/items/{item_id}/reviews
# → 대신 /api/reviews?item_id={item_id} 사용
```

### 5. 일관된 응답 구조

```python
# 목록 응답
{
    "data": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "has_more": true
}

# 단일 객체 응답
{
    "id": "...",
    "name": "...",
    ...
}

# 에러 응답
{
    "error": {
        "code": "RESOURCE_NOT_FOUND",
        "message": "Product not found"
    }
}
```

---

## 금지 패턴 (NEVER)

### 1. 화면명 URL ❌

```python
# ❌ 절대 금지
@router.get("/api/screens/product-list")
@router.get("/api/pages/home")
@router.get("/api/views/dashboard")
```

### 2. Aggregate 엔드포인트 ❌

```python
# ❌ 절대 금지
@router.get("/api/home-page-data")
async def get_home_page_data():
    return {
        "featured_products": ...,
        "categories": ...,
        "banners": ...,
        "recent_orders": ...
    }

# ✅ 대신 개별 API 호출
GET /api/products?featured=true
GET /api/categories
GET /api/banners
GET /api/orders?recent=true
```

### 3. 화면 전용 에러 메시지 ❌

```python
# ❌ 잘못됨 - 화면 종속적
raise HTTPException(
    status_code=400,
    detail="장바구니에 상품을 추가할 수 없습니다. 재고가 부족합니다."
)

# ✅ 올바름 - 코드 기반
raise HTTPException(
    status_code=400,
    detail={
        "code": "INSUFFICIENT_STOCK",
        "available": 5,
        "requested": 10
    }
)
```

### 4. 비즈니스 로직의 포맷팅 ❌

```python
# ❌ 잘못됨 - 서버에서 포맷팅
class ProductResponse(BaseModel):
    price_formatted: str  # "10,000원"
    discount_text: str    # "20% 할인"

# ✅ 올바름 - Raw 데이터만
class ProductResponse(BaseModel):
    price: int           # 10000
    discount_rate: float # 0.2
```

---

## 올바른 패턴

### Router 구조

```python
# app/api/products.py
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.products import ProductResponse, ProductListResponse
from app.services.products import ProductService

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=ProductListResponse)
async def list_products(
    category: str | None = None,
    page: int = 1,
    limit: int = 20,
    sort: str = "created_at",
    service: ProductService = Depends()
):
    """상품 목록 조회"""
    return await service.list_products(
        category=category,
        page=page,
        limit=limit,
        sort=sort
    )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    service: ProductService = Depends()
):
    """상품 상세 조회"""
    product = await service.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
```

### Schema 정의

```python
# app/schemas/products.py
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ProductResponse(BaseModel):
    id: UUID
    name: str
    description: str
    price: int              # Raw 숫자
    discount_rate: float    # Raw 비율
    stock: int
    category_id: UUID
    thumbnail: str | None
    created_at: datetime    # ISO 8601

class ProductListResponse(BaseModel):
    data: list[ProductResponse]
    total: int
    page: int
    limit: int
    has_more: bool
```

### 에러 코드 정의

```python
# app/errors.py
from enum import Enum

class ErrorCode(str, Enum):
    # 리소스 에러
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS"

    # 비즈니스 로직 에러
    INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK"
    INVALID_QUANTITY = "INVALID_QUANTITY"
    ORDER_LIMIT_EXCEEDED = "ORDER_LIMIT_EXCEEDED"

    # 인증/인가 에러
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
```

---

## 위반 감지 방법

### 1. 화면명 URL 패턴 검사

```bash
# 화면명 URL 패턴 검출
grep -rn "screens\|pages\|views" --include="*.py" app/api/

# 예상 결과: 매치 없어야 함
```

### 2. 포맷된 응답 검사

```bash
# 포맷된 문자열 패턴 검출
grep -rn '원"\|%"\|할인"' --include="*.py" app/schemas/

# 예상 결과: 매치 없어야 함
```

### 3. Aggregate 엔드포인트 검사

```bash
# page-data, home-data 등 검출
grep -rn "page-data\|home-data\|dashboard-data" --include="*.py" app/api/

# 예상 결과: 매치 없어야 함
```

---

## 체크리스트

```
+---------------------------------------------------------------------+
|  FastAPI API Design 체크리스트                                        |
+---------------------------------------------------------------------+
|                                                                     |
|  [ ] 1. 모든 엔드포인트가 복수형 명사인가?                              |
|         /api/products, /api/orders, /api/users                      |
|                                                                     |
|  [ ] 2. 화면명이 URL에 포함되어 있지 않은가?                           |
|         screens, pages, views 패턴 없음                              |
|                                                                     |
|  [ ] 3. 응답이 Raw 데이터인가?                                        |
|         price: 10000 (not "10,000원")                                |
|                                                                     |
|  [ ] 4. 에러가 코드 기반인가?                                         |
|         code: "INSUFFICIENT_STOCK" (not 화면 메시지)                 |
|                                                                     |
|  [ ] 5. 중첩 리소스가 2단계 이하인가?                                  |
|         /api/orders/{id}/items (최대)                                |
|                                                                     |
+---------------------------------------------------------------------+
```

---

## 관련 문서

- [FastAPI Auth 헌법](./auth.md)
- [FastAPI Dependencies 헌법](./dependencies.md)
- [Next.js API Design 헌법](../nextjs/api-design.md)
