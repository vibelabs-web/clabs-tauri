# UUID 헌법

> RFC 4122 준수 필수 규칙
> **UUID 형식 불일치로 인한 Zod 검증 실패 방지**

---

## 왜 중요한가?

### 실패 사례 (vibeShop)

```
시드 데이터: "prod-001"
Zod 스키마: z.string().uuid()
결과: 검증 실패 → 앱 크래시
```

### 근본 원인

```
개발자가 읽기 쉬운 ID vs 표준 UUID
→ 일관성 없는 ID 형식 사용
→ 런타임 검증 실패
```

---

## 필수 규칙 (MUST)

### 1. 모든 ID는 RFC 4122 UUID v4 사용

```typescript
// ✅ 올바름 - crypto.randomUUID()
const id = crypto.randomUUID();
// 결과: "550e8400-e29b-41d4-a716-446655440000"

// ✅ 올바름 - uuid 패키지
import { v4 as uuidv4 } from "uuid";
const id = uuidv4();
```

### 2. Zod 스키마에서 UUID 검증

```typescript
// schemas/product.ts
import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string().uuid(), // RFC 4122 검증
  name: z.string().min(1),
  price: z.number().positive(),
  categoryId: z.string().uuid(), // FK도 UUID
  createdAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;
```

### 3. 시드 데이터에서 실제 UUID 사용

```typescript
// prisma/seed.ts 또는 supabase/seed.sql
const products = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000", // ✅ 실제 UUID
    name: "테스트 상품",
    price: 10000,
  },
];

// ❌ 금지
const badProducts = [
  {
    id: "prod-001", // 커스텀 형식
    id: "1", // 숫자
    id: "test-product", // 슬러그
  },
];
```

### 4. SQL에서 UUID 타입 사용

```sql
-- PostgreSQL/Supabase
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 금지 - VARCHAR나 TEXT 사용
CREATE TABLE bad_products (
  id VARCHAR(50) PRIMARY KEY,  -- UUID 타입 아님
  id TEXT PRIMARY KEY,         -- UUID 타입 아님
);
```

---

## 금지 패턴 (NEVER)

### 1. 커스텀 ID 형식 금지

```typescript
// ❌ 금지
const customId = `prod-${Date.now()}`;
const customId = `user_${Math.random()}`;
const customId = "item-001";

// ✅ 올바름
const id = crypto.randomUUID();
```

### 2. 시드에서 하드코딩된 비-UUID 금지

```typescript
// ❌ 금지 - 읽기 쉽지만 잘못됨
const seeds = {
  categories: [
    { id: "electronics", name: "전자제품" },
    { id: "clothing", name: "의류" },
  ],
};

// ✅ 올바름 - UUID 사용
const seeds = {
  categories: [
    { id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", name: "전자제품" },
    { id: "7c9e6679-7425-40de-944b-e07fc1f90ae7", name: "의류" },
  ],
};
```

### 3. Optional UUID에서 빈 문자열 금지

```typescript
// ❌ 금지
const data = {
  parentId: "", // 빈 문자열은 UUID 아님
};

// ✅ 올바름
const data = {
  parentId: null, // 또는 undefined
};

// 스키마
const Schema = z.object({
  parentId: z.string().uuid().nullable(), // null 허용
});
```

---

## UUID 생성 방법

### JavaScript/TypeScript

```typescript
// 방법 1: Web Crypto API (권장)
const id = crypto.randomUUID();

// 방법 2: uuid 패키지
import { v4 as uuidv4 } from "uuid";
const id = uuidv4();

// 방법 3: Prisma에서 자동 생성
model Product {
  id String @id @default(uuid())
}
```

### Python

```python
# 방법 1: uuid 모듈 (권장)
import uuid
id = str(uuid.uuid4())

# 방법 2: SQLAlchemy 기본값
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Product(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

### SQL (PostgreSQL/Supabase)

```sql
-- 방법 1: gen_random_uuid() (권장)
INSERT INTO products (id, name) VALUES (gen_random_uuid(), '테스트');

-- 방법 2: 테이블 기본값으로 설정
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
```

---

## UUID 검증

### RFC 4122 정규식

```typescript
// UUID v4 정규식 (가장 일반적)
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 모든 UUID 버전
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 검증 함수
function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}
```

### Zod 검증

```typescript
import { z } from "zod";

// 기본 UUID 검증
const schema = z.string().uuid();

// 커스텀 에러 메시지
const schema = z.string().uuid({ message: "유효한 UUID 형식이 아닙니다" });

// 사용
const result = schema.safeParse("invalid-id");
if (!result.success) {
  console.error(result.error.issues);
}
```

---

## 위반 감지 스크립트

```typescript
// scripts/verify-uuid.ts
import { z } from "zod";
import fs from "fs";
import path from "path";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function verifySeedUUIDs() {
  const seedFiles = ["prisma/seed.ts", "supabase/seed.sql", "data/seeds.json"];

  const issues: string[] = [];

  for (const file of seedFiles) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, "utf-8");

    // ID 패턴 찾기
    const idMatches = content.matchAll(/["']?id["']?\s*[:=]\s*["']([^"']+)["']/g);

    for (const match of idMatches) {
      const id = match[1];
      if (!UUID_REGEX.test(id)) {
        issues.push(`${file}: 비-UUID ID 발견 - "${id}"`);
      }
    }
  }

  if (issues.length > 0) {
    console.error("❌ UUID 위반 발견:");
    issues.forEach((issue) => console.error(`  - ${issue}`));
    process.exit(1);
  }

  console.log("✅ 모든 시드 ID가 UUID 형식입니다");
}

verifySeedUUIDs();
```

### CLI로 실행

```bash
# 시드 파일 UUID 검증
npx ts-node scripts/verify-uuid.ts

# 또는 package.json에 추가
{
  "scripts": {
    "verify:uuid": "ts-node scripts/verify-uuid.ts"
  }
}
```

---

## 체크리스트

배포 전 확인:

- [ ] 모든 스키마에서 ID 필드가 `z.string().uuid()` 사용
- [ ] 시드 데이터의 모든 ID가 RFC 4122 UUID 형식
- [ ] DB 스키마에서 ID 컬럼이 UUID 타입
- [ ] FK도 UUID 타입으로 일치
- [ ] 커스텀 ID 형식 (prod-001, user_123 등) 없음
- [ ] `verify-uuid.ts` 스크립트가 CI에서 실행됨
