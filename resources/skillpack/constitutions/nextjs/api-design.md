# Next.js API Design 헌법

> "백엔드 API는 화면에 종속되지 않는다"
> App Router 스타일 Resource-Oriented API Design

---

## 왜 이 헌법이 필요한가?

### 실패 사례

| 실패 | 원인 | 올바른 패턴 |
|------|------|------------|
| `/api/screens/product-list` | 화면명 URL | `/api/products` |
| `price: "10,000원"` | 포맷된 응답 | `price: 10000` |
| `/api/home-page-data` | Aggregate 엔드포인트 | 개별 리소스 API |
| "장바구니에 추가할 수 없습니다" | 화면 전용 에러 | `{ code: "INSUFFICIENT_STOCK" }` |

---

## 필수 규칙 (MUST)

### 1. RESTful 파일 구조 (App Router)

```
app/
└── api/
    ├── products/
    │   ├── route.ts           # GET /api/products, POST /api/products
    │   └── [id]/
    │       └── route.ts       # GET/PUT/DELETE /api/products/:id
    ├── categories/
    │   └── route.ts           # GET /api/categories
    └── orders/
        ├── route.ts           # GET/POST /api/orders
        └── [id]/
            ├── route.ts       # GET/PUT /api/orders/:id
            └── items/
                └── route.ts   # GET/POST /api/orders/:id/items
```

### 2. 복수형 명사 리소스

```typescript
// ✅ 올바름
app/api/products/route.ts      // /api/products
app/api/categories/route.ts    // /api/categories
app/api/orders/route.ts        // /api/orders

// ❌ 잘못됨
app/api/product/route.ts       // 단수형
app/api/getProducts/route.ts   // 동사 시작
app/api/product-list/route.ts  // 화면 종속적
```

### 3. Raw 데이터 반환 (포맷팅 금지)

```typescript
// ✅ 올바름 - Raw 데이터
export async function GET() {
  return NextResponse.json({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "상품명",
    price: 10000,                              // 숫자
    createdAt: "2024-01-15T10:30:00Z"          // ISO 8601
  });
}

// ❌ 잘못됨 - 포맷된 데이터
export async function GET() {
  return NextResponse.json({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "상품명",
    price: "10,000원",                         // 포맷된 문자열
    createdAt: "2024년 1월 15일"               // 로케일 포맷
  });
}
```

### 4. 일관된 응답 구조

```typescript
// 목록 응답
interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 단일 객체 응답 - 객체 직접 반환
interface Product {
  id: string;
  name: string;
  price: number;
}

// 에러 응답
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 5. HTTP 메서드 핸들러

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // ... 데이터 조회

  return NextResponse.json({
    data: products,
    total: 100,
    page,
    limit,
    hasMore: page * limit < 100
  });
}

// POST /api/products
export async function POST(request: NextRequest) {
  const body = await request.json();
  // ... 생성 로직
  return NextResponse.json(newProduct, { status: 201 });
}
```

---

## 금지 패턴 (NEVER)

### 1. 화면명 URL ❌

```typescript
// ❌ 절대 금지
app/api/screens/product-list/route.ts
app/api/pages/home/route.ts
app/api/views/dashboard/route.ts
```

### 2. Aggregate 엔드포인트 ❌

```typescript
// ❌ 절대 금지 - app/api/home-page-data/route.ts
export async function GET() {
  return NextResponse.json({
    featuredProducts: await getFeaturedProducts(),
    categories: await getCategories(),
    banners: await getBanners(),
    recentOrders: await getRecentOrders()
  });
}

// ✅ 대신 개별 API 호출
// GET /api/products?featured=true
// GET /api/categories
// GET /api/banners
// GET /api/orders?recent=true
```

### 3. 화면 전용 에러 메시지 ❌

```typescript
// ❌ 잘못됨 - 화면 종속적
return NextResponse.json(
  { error: "장바구니에 상품을 추가할 수 없습니다. 재고가 부족합니다." },
  { status: 400 }
);

// ✅ 올바름 - 코드 기반
return NextResponse.json(
  {
    error: {
      code: "INSUFFICIENT_STOCK",
      message: "Insufficient stock",
      details: { available: 5, requested: 10 }
    }
  },
  { status: 400 }
);
```

### 4. Server Component에서 API Route 호출 ❌

```typescript
// ❌ 잘못됨 - Server Component에서 자체 API 호출
// app/products/page.tsx
async function ProductsPage() {
  const res = await fetch('/api/products');  // 불필요한 네트워크 왕복
  const products = await res.json();
}

// ✅ 올바름 - 직접 데이터 조회
// app/products/page.tsx
import { getProducts } from '@/lib/products';

async function ProductsPage() {
  const products = await getProducts();  // 직접 DB/서비스 호출
}
```

---

## 올바른 패턴

### API Route 구조

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProducts, createProduct } from '@/lib/products';
import { ErrorCode } from '@/lib/errors';

const querySchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest')
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const result = await getProducts(query);

    return NextResponse.json({
      data: result.products,
      total: result.total,
      page: query.page,
      limit: query.limit,
      hasMore: query.page * query.limit < result.total
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: ErrorCode.VALIDATION_ERROR, details: error.errors } },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### 동적 라우트

```typescript
// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getProduct, updateProduct, deleteProduct } from '@/lib/products';
import { ErrorCode } from '@/lib/errors';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const product = await getProduct(params.id);

  if (!product) {
    return NextResponse.json(
      { error: { code: ErrorCode.RESOURCE_NOT_FOUND, message: 'Product not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const body = await request.json();
  const updated = await updateProduct(params.id, body);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  await deleteProduct(params.id);
  return new NextResponse(null, { status: 204 });
}
```

### 타입 정의

```typescript
// types/api.ts

// 공통 응답 타입
export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// 리소스 타입 (Raw 데이터)
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;            // Raw 숫자
  discountRate: number;     // Raw 비율
  stock: number;
  categoryId: string;
  thumbnail: string | null;
  createdAt: string;        // ISO 8601
}
```

### 에러 코드 정의

```typescript
// lib/errors.ts
export enum ErrorCode {
  // 리소스 에러
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

  // 비즈니스 로직 에러
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  ORDER_LIMIT_EXCEEDED = 'ORDER_LIMIT_EXCEEDED',

  // 검증 에러
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // 인증/인가 에러
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN'
}
```

---

## 위반 감지 방법

### 1. 화면명 URL 패턴 검사

```bash
# 화면명 URL 패턴 검출
find app/api -type d -name "screens" -o -name "pages" -o -name "views"

# 예상 결과: 매치 없어야 함
```

### 2. 포맷된 응답 검사

```bash
# 포맷된 문자열 패턴 검출
grep -rn '원"\|%"\|할인"' --include="*.ts" --include="*.tsx" app/api/

# 예상 결과: 매치 없어야 함
```

### 3. Aggregate 엔드포인트 검사

```bash
# page-data, home-data 등 검출
find app/api -type d -name "*-data" -o -name "*-page-*"

# 예상 결과: 매치 없어야 함
```

---

## 체크리스트

```
+---------------------------------------------------------------------+
|  Next.js API Design 체크리스트                                        |
+---------------------------------------------------------------------+
|                                                                     |
|  [ ] 1. 모든 API 폴더가 복수형 명사인가?                               |
|         app/api/products/, app/api/orders/, app/api/users/          |
|                                                                     |
|  [ ] 2. 화면명이 URL에 포함되어 있지 않은가?                           |
|         screens, pages, views 폴더 없음                              |
|                                                                     |
|  [ ] 3. 응답이 Raw 데이터인가?                                        |
|         price: 10000 (not "10,000원")                                |
|                                                                     |
|  [ ] 4. 에러가 코드 기반인가?                                         |
|         code: "INSUFFICIENT_STOCK" (not 화면 메시지)                 |
|                                                                     |
|  [ ] 5. Server Component에서 자체 API Route 호출하지 않는가?          |
|         직접 lib/ 함수 호출                                          |
|                                                                     |
+---------------------------------------------------------------------+
```

---

## 관련 문서

- [Next.js Auth 헌법](./auth.md)
- [Next.js API Routes 헌법](./api-routes.md)
- [FastAPI API Design 헌법](../fastapi/api-design.md)
