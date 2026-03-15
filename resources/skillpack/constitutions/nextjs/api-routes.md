# Next.js API Routes 헌법

> App Router API Route 필수 규칙
> **일관된 에러 처리, 응답 형식, 보안 패턴**

---

## 필수 규칙 (MUST)

### 1. 일관된 응답 형식

```typescript
// 성공 응답
return NextResponse.json({
  data: result,
  success: true,
});

// 에러 응답
return NextResponse.json(
  {
    error: "Error message",
    code: "ERROR_CODE",
    success: false,
  },
  { status: 400 }
);
```

### 2. 모든 API에 try-catch

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ... 로직
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

### 3. 입력값 검증 (Zod 사용)

```typescript
import { z } from "zod";

const CreateProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateProductSchema.parse(body);
    // ... validated 사용
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### 4. HTTP 상태 코드 규칙

| 상황 | 상태 코드 |
|------|----------|
| 성공 (데이터 반환) | 200 |
| 생성 성공 | 201 |
| 성공 (데이터 없음) | 204 |
| 잘못된 요청 | 400 |
| 인증 필요 | 401 |
| 권한 없음 | 403 |
| 리소스 없음 | 404 |
| 서버 에러 | 500 |

---

## 금지 패턴 (NEVER)

### 1. 에러 시 200 반환 금지

```typescript
// ❌ 금지
return NextResponse.json({ error: "Failed" }); // status 200

// ✅ 올바름
return NextResponse.json({ error: "Failed" }, { status: 400 });
```

### 2. 민감 정보 응답 노출 금지

```typescript
// ❌ 금지 - 스택 트레이스 노출
return NextResponse.json({ error: error.stack }, { status: 500 });

// ❌ 금지 - DB 에러 메시지 노출
return NextResponse.json({ error: dbError.message }, { status: 500 });

// ✅ 올바름
console.error("DB Error:", dbError); // 서버 로그에만
return NextResponse.json(
  { error: "Internal Server Error" },
  { status: 500 }
);
```

### 3. request.body 직접 사용 금지

```typescript
// ❌ 금지 - 검증 없이 사용
const { name, price } = await request.json();
await db.insert({ name, price }); // SQL Injection 위험

// ✅ 올바름
const body = await request.json();
const { name, price } = ProductSchema.parse(body);
await db.insert({ name, price });
```

---

## 올바른 패턴

### 표준 API Route 템플릿

```typescript
// app/api/products/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// 입력 스키마
const CreateProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
});

// GET - 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const products = await db.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.product.count();

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - 생성 (인증 필요)
export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 입력 검증
    const body = await request.json();
    const validated = CreateProductSchema.parse(body);

    // 3. 비즈니스 로직
    const product = await db.product.create({
      data: {
        ...validated,
        userId: user.id,
      },
    });

    // 4. 응답
    return NextResponse.json(
      { data: product },
      { status: 201 }
    );
  } catch (error) {
    // Zod 검증 에러
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
```

### Dynamic Route 템플릿

```typescript
// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - 단일 조회
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // UUID 검증
    const idSchema = z.string().uuid();
    const id = idSchema.parse(params.id);

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    console.error(`GET /api/products/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// DELETE - 삭제 (인증 + 권한)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // 권한 확인
    if (product.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await db.product.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/products/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
```

---

## CORS 설정

```typescript
// middleware.ts 또는 next.config.js
export async function middleware(request: Request) {
  // CORS 헤더
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      headers: {
        "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
}
```

---

## 위반 감지 방법

```bash
# 1. 에러 시 200 반환 검사
grep -rn "NextResponse.json.*error" --include="*.ts" . | grep -v "status:"

# 2. try-catch 없는 API 검사
grep -l "export async function" app/api/**/*.ts | while read f; do
  if ! grep -q "try {" "$f"; then
    echo "Missing try-catch: $f"
  fi
done

# 3. Zod 없는 POST/PUT 검사
grep -l "export async function POST\|export async function PUT" app/api/**/*.ts | while read f; do
  if ! grep -q "z\." "$f"; then
    echo "Missing Zod validation: $f"
  fi
done
```
