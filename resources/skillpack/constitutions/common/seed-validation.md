# Seed Validation 헌법

> 시드 데이터 ↔ 스키마 일치 필수 규칙
> **런타임 검증 실패 및 타입 불일치 방지**

---

## 왜 중요한가?

### 실패 사례 (vibeShop)

```
시드 데이터:
{
  "id": "prod-001",           // string (비-UUID)
  "price": "10000",           // string (숫자 아님)
  "createdAt": "2024-01-01"   // ISO 8601 아님
}

Zod 스키마:
{
  id: z.string().uuid(),
  price: z.number(),
  createdAt: z.string().datetime()
}

결과: 3개 필드 모두 검증 실패 → 앱 크래시
```

### 근본 원인

```
시드 데이터는 수동 작성 → 오타, 형식 오류 발생 쉬움
스키마는 엄격한 타입 검증 → 불일치 시 런타임 에러
```

---

## 필수 규칙 (MUST)

### 1. 시드 데이터는 Zod 스키마로 검증 후 저장

```typescript
// prisma/seed.ts
import { ProductSchema, CategorySchema } from "@/schemas";
import { z } from "zod";

// 시드 데이터 정의
const rawProducts = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "테스트 상품",
    price: 10000,
    categoryId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    createdAt: new Date().toISOString(),
  },
];

// 검증 후 사용
const products = z.array(ProductSchema).parse(rawProducts);

async function seed() {
  for (const product of products) {
    await prisma.product.create({ data: product });
  }
}
```

### 2. 시드 검증 스크립트 필수

```typescript
// scripts/validate-seeds.ts
import { z } from "zod";
import { ProductSchema, CategorySchema, UserSchema } from "@/schemas";

// 모든 시드 데이터 import
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { users } from "@/data/users";

const seedValidations = [
  { name: "products", data: products, schema: z.array(ProductSchema) },
  { name: "categories", data: categories, schema: z.array(CategorySchema) },
  { name: "users", data: users, schema: z.array(UserSchema) },
];

async function validateSeeds() {
  const errors: string[] = [];

  for (const { name, data, schema } of seedValidations) {
    const result = schema.safeParse(data);

    if (!result.success) {
      errors.push(`❌ ${name}: ${result.error.message}`);
    } else {
      console.log(`✅ ${name}: ${data.length}개 항목 검증 통과`);
    }
  }

  if (errors.length > 0) {
    console.error("\n시드 검증 실패:");
    errors.forEach((e) => console.error(e));
    process.exit(1);
  }

  console.log("\n✅ 모든 시드 데이터 검증 통과!");
}

validateSeeds();
```

### 3. 타입 공유: 스키마 → 시드 → API

```typescript
// schemas/product.ts (단일 진실의 원천)
import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
  imageUrl: z.string().url().optional(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;

// 생성용 스키마 (id, createdAt 등 자동 생성)
export const ProductCreateSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
```

```typescript
// data/products.ts (시드 데이터)
import { Product } from "@/schemas/product";

export const products: Product[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "테스트 상품",
    price: 10000,
    categoryId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    stock: 100,
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];
```

### 4. FK 관계 검증

```typescript
// scripts/validate-seeds.ts에 추가

function validateForeignKeys() {
  const categoryIds = new Set(categories.map((c) => c.id));

  for (const product of products) {
    if (!categoryIds.has(product.categoryId)) {
      throw new Error(
        `Product ${product.id}의 categoryId ${product.categoryId}가 존재하지 않음`
      );
    }
  }

  console.log("✅ FK 관계 검증 통과");
}
```

---

## 금지 패턴 (NEVER)

### 1. 스키마 없이 시드 데이터 사용 금지

```typescript
// ❌ 금지 - 타입 검증 없음
const products = [
  { id: "1", name: "상품", price: "10000" }, // price가 string!
];

await prisma.product.createMany({ data: products });

// ✅ 올바름 - 스키마 검증 후 사용
const validated = z.array(ProductSchema).parse(products);
await prisma.product.createMany({ data: validated });
```

### 2. 하드코딩된 날짜 형식 불일치 금지

```typescript
// ❌ 금지 - 다양한 날짜 형식
const seeds = [
  { createdAt: "2024-01-01" }, // ISO 8601 아님
  { createdAt: "01/01/2024" }, // 미국 형식
  { createdAt: "2024.01.01" }, // 점 구분
];

// ✅ 올바름 - ISO 8601 형식 통일
const seeds = [
  { createdAt: "2024-01-01T00:00:00.000Z" },
  { createdAt: new Date().toISOString() },
];
```

### 3. 시드와 스키마 분리 관리 금지

```typescript
// ❌ 금지 - 스키마와 시드가 별도 정의
// schemas/product.ts
const ProductSchema = z.object({ price: z.number() });

// seeds/products.json (별도 파일, 타입 검증 없음)
[{ "price": "10000" }]  // string으로 잘못 입력

// ✅ 올바름 - 시드가 스키마 타입 사용
// data/products.ts
import { Product } from "@/schemas/product";
export const products: Product[] = [{ price: 10000 }];
```

---

## 시드 데이터 구조

### 권장 폴더 구조

```
src/
├── schemas/           # Zod 스키마 (단일 진실의 원천)
│   ├── index.ts
│   ├── product.ts
│   ├── category.ts
│   └── user.ts
├── data/              # 시드 데이터 (스키마 타입 사용)
│   ├── index.ts
│   ├── products.ts
│   ├── categories.ts
│   └── users.ts
└── scripts/
    ├── seed.ts        # 시드 실행
    └── validate-seeds.ts  # 시드 검증
```

### 시드 파일 템플릿

```typescript
// data/products.ts
import { Product } from "@/schemas/product";

/**
 * 상품 시드 데이터
 *
 * 규칙:
 * - 모든 ID는 UUID v4
 * - 날짜는 ISO 8601 형식
 * - FK는 해당 테이블 시드에 존재해야 함
 */
export const products: Product[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "무선 이어폰",
    description: "고음질 블루투스 이어폰",
    price: 89000,
    categoryId: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // electronics
    imageUrl: "https://example.com/images/earbuds.jpg",
    stock: 50,
    isActive: true,
    createdAt: "2024-01-15T09:00:00.000Z",
    updatedAt: "2024-01-15T09:00:00.000Z",
  },
  // ... 더 많은 데이터
];
```

---

## 검증 자동화

### CI/CD 통합

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Validate seed data
        run: npm run validate:seeds

      - name: Type check
        run: npm run type-check
```

### package.json 스크립트

```json
{
  "scripts": {
    "validate:seeds": "ts-node scripts/validate-seeds.ts",
    "seed": "npm run validate:seeds && ts-node prisma/seed.ts",
    "preseed": "npm run validate:seeds"
  }
}
```

---

## 완전한 검증 스크립트

```typescript
// scripts/validate-seeds.ts
import { z } from "zod";
import { ProductSchema, CategorySchema, UserSchema } from "@/schemas";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { users } from "@/data/users";

interface ValidationResult {
  name: string;
  passed: boolean;
  count: number;
  errors?: string[];
}

async function validateAll(): Promise<void> {
  const results: ValidationResult[] = [];

  // 1. 스키마 검증
  const validations = [
    { name: "categories", data: categories, schema: z.array(CategorySchema) },
    { name: "products", data: products, schema: z.array(ProductSchema) },
    { name: "users", data: users, schema: z.array(UserSchema) },
  ];

  for (const { name, data, schema } of validations) {
    const result = schema.safeParse(data);

    if (result.success) {
      results.push({ name, passed: true, count: data.length });
    } else {
      const errors = result.error.issues.map(
        (i) => `  - ${i.path.join(".")}: ${i.message}`
      );
      results.push({ name, passed: false, count: data.length, errors });
    }
  }

  // 2. FK 관계 검증
  const categoryIds = new Set(categories.map((c) => c.id));
  const fkErrors: string[] = [];

  for (const product of products) {
    if (!categoryIds.has(product.categoryId)) {
      fkErrors.push(
        `  - Product ${product.id}: categoryId "${product.categoryId}" 존재하지 않음`
      );
    }
  }

  if (fkErrors.length > 0) {
    results.push({
      name: "FK relations",
      passed: false,
      count: products.length,
      errors: fkErrors,
    });
  } else {
    results.push({ name: "FK relations", passed: true, count: products.length });
  }

  // 3. 중복 ID 검증
  const allIds = [...categories, ...products, ...users].map((item) => item.id);
  const duplicates = allIds.filter((id, i) => allIds.indexOf(id) !== i);

  if (duplicates.length > 0) {
    results.push({
      name: "Unique IDs",
      passed: false,
      count: allIds.length,
      errors: [`  - 중복 ID: ${[...new Set(duplicates)].join(", ")}`],
    });
  } else {
    results.push({ name: "Unique IDs", passed: true, count: allIds.length });
  }

  // 결과 출력
  console.log("\n=== 시드 데이터 검증 결과 ===\n");

  let hasErrors = false;

  for (const result of results) {
    if (result.passed) {
      console.log(`✅ ${result.name}: ${result.count}개 항목 통과`);
    } else {
      hasErrors = true;
      console.log(`❌ ${result.name}: 검증 실패`);
      result.errors?.forEach((e) => console.log(e));
    }
  }

  if (hasErrors) {
    console.log("\n❌ 시드 데이터 검증 실패!");
    process.exit(1);
  }

  console.log("\n✅ 모든 시드 데이터 검증 통과!");
}

validateAll();
```

---

## 체크리스트

배포 전 확인:

- [ ] 모든 시드 데이터가 Zod 스키마 타입 사용
- [ ] 시드 파일에서 타입 import (예: `Product[]`)
- [ ] FK 관계가 시드 간 일치
- [ ] ID 중복 없음
- [ ] 날짜 형식 ISO 8601 통일
- [ ] `validate-seeds.ts` 스크립트 존재
- [ ] CI에서 시드 검증 실행
- [ ] `npm run seed` 전에 검증 실행 (`preseed`)
