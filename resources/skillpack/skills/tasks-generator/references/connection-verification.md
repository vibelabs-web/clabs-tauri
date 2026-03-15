# 연결점 검증 규칙

> 이 문서는 화면 간, 레이어 간 연결점을 검증하는 태스크 생성 규칙을 정의합니다.
> **vibeShop 사례에서 발견된 3가지 실패 유형을 방지합니다.**

---

## 왜 연결점 검증이 필요한가?

### 실패 사례 분석 (vibeShop)

| 실패 유형 | 증상 | 원인 |
|----------|------|------|
| **Auth 불일치** | Cart API 500 에러 | NextAuth.js 마이그레이션 후 supabase.auth.getUser() 잔존 |
| **Seed-Schema 불일치** | Zod 검증 실패 | 시드 UUID가 RFC 4122 미준수 |
| **Link-Page 불일치** | Footer 링크 404 | 13개 링크 중 0개 페이지 구현 |

### 근본 원인

```
각 파트는 개별적으로 작동하지만,
파트 간 연결점이 검증되지 않음
```

---

## 연결점 유형

### 1. API 연결점

컴포넌트 → API 엔드포인트 연결

```yaml
# 화면 명세에서 추출
components:
  - id: product_grid
    api:
      endpoint: GET /api/products
      response:
        type: object
        fields:
          products: Product[]
          total: number
```

**검증 항목:**
- [ ] 엔드포인트 존재 여부
- [ ] 응답 타입 일치
- [ ] 에러 응답 처리

### 2. 네비게이션 연결점

화면 A → 화면 B 이동

```yaml
# 화면 명세에서 추출
connections:
  navigations:
    - from: product_card
      to: /products/:id
      params:
        id: product.id
```

**검증 항목:**
- [ ] 타겟 라우트 존재
- [ ] 파라미터 전달
- [ ] 뒤로 가기 동작

### 3. Auth 연결점

인증 상태에 따른 동작 분기

```yaml
# 화면 명세에서 추출
screen:
  auth_required: true

connections:
  external:
    - service: auth
      action: getUser
      component: wishlist_button
```

**검증 항목:**
- [ ] Auth 라이브러리 일관성 (NextAuth/Supabase/Firebase 중 하나만)
- [ ] 비로그인 시 동작 (리다이렉트/모달)
- [ ] 토큰 갱신 처리

### 4. 데이터 타입 연결점

API 응답 ↔ 프론트엔드 타입 일치

```yaml
# 화면 명세에서 추출
api:
  response:
    type: Product[]
    fields:
      id: string (UUID)
      name: string
      price: number
```

**검증 항목:**
- [ ] TypeScript 타입 일치
- [ ] Zod 스키마 일치
- [ ] 시드 데이터 일치

### 5. 공통 컴포넌트 연결점

여러 화면에서 사용하는 공통 컴포넌트

```yaml
# 화면 명세에서 추출
connections:
  shared_components:
    - ref: header
      slot: top
    - ref: footer
      slot: bottom
```

**검증 항목:**
- [ ] 컴포넌트 렌더링
- [ ] 컴포넌트 내 링크 유효성
- [ ] 상태 공유 (로그인 상태 등)

---

## 검증 태스크 생성 규칙

### 태스크 ID 형식

```
P{Phase}-S{Screen}-V: 연결점 검증
```

### 검증 태스크 템플릿

```markdown
### [ ] P2-S1-V: 연결점 검증
- **담당**: test-specialist
- **화면**: /products
- **검증 유형**:
  - **API 연결** (2개):
    - [ ] GET /api/categories → CategorySidebar
    - [ ] GET /api/products → ProductGrid
  - **네비게이션** (1개):
    - [ ] ProductCard 클릭 → /products/:id
  - **Auth** (1개):
    - [ ] 찜하기 버튼 → 로그인 체크 일관성
  - **공통 컴포넌트** (2개):
    - [ ] Header 렌더링 + 링크 유효성
    - [ ] Footer 렌더링 + 링크 유효성
- **파일**: `tests/integration/product-list.verify.ts`
```

---

## 검증 유형별 테스트 코드

### 1. API 연결 검증

```typescript
// tests/integration/product-list.verify.ts

describe('P2-S1-V: 상품 목록 연결점 검증', () => {
  describe('API 연결', () => {
    it('GET /api/categories 엔드포인트 존재', async () => {
      const res = await fetch('/api/categories');
      expect(res.status).not.toBe(404);
    });

    it('GET /api/categories 응답 타입 일치', async () => {
      const res = await fetch('/api/categories');
      const data = await res.json();

      // Zod 스키마로 검증
      const result = CategoryArraySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('GET /api/products 엔드포인트 존재', async () => {
      const res = await fetch('/api/products');
      expect(res.status).not.toBe(404);
    });
  });
});
```

### 2. 네비게이션 검증

```typescript
describe('네비게이션 연결', () => {
  it('ProductCard → /products/:id 라우트 존재', async () => {
    // 실제 상품 ID로 테스트
    const productId = 'test-product-id';
    const res = await fetch(`/products/${productId}`);
    expect(res.status).not.toBe(404);
  });

  it('ProductCard 클릭 시 상세 페이지 이동', async () => {
    render(<ProductList />);

    const card = screen.getByTestId('product-card-1');
    await userEvent.click(card);

    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringMatching(/\/products\//)
    );
  });
});
```

### 3. Auth 일관성 검증

```typescript
describe('Auth 연결', () => {
  it('Auth 라이브러리 일관성 검사', async () => {
    // 프로젝트에서 사용하는 Auth import 검사
    const authImports = await findAuthImports();

    // 하나의 라이브러리만 사용해야 함
    const authLibraries = new Set(authImports.map(i => i.library));
    expect(authLibraries.size).toBe(1);
  });

  it('비로그인 상태에서 찜하기 클릭 시 로그인 모달', async () => {
    // 비로그인 상태 모킹
    mockUseSession.mockReturnValue({ data: null });

    render(<ProductCard product={mockProduct} />);

    const wishlistBtn = screen.getByTestId('wishlist-button');
    await userEvent.click(wishlistBtn);

    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
  });
});
```

### 4. 데이터 타입 검증

```typescript
describe('데이터 타입 연결', () => {
  it('시드 데이터 UUID가 Zod 스키마와 일치', async () => {
    const seedProducts = await getSeedProducts();

    for (const product of seedProducts) {
      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(true);

      // UUID 형식 검사 (RFC 4122)
      expect(product.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    }
  });
});
```

### 5. 공통 컴포넌트 검증

```typescript
describe('공통 컴포넌트 연결', () => {
  it('Header 렌더링 확인', () => {
    render(<ProductListPage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('Footer 링크가 404가 아님', async () => {
    render(<Footer />);

    const links = screen.getAllByRole('link');

    for (const link of links) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http')) {
        const res = await fetch(href);
        expect(res.status).not.toBe(404);
      }
    }
  });
});
```

---

## Phase별 연결점 검증 요약

각 Phase 마지막에 연결점 검증 요약 태스크를 추가합니다:

```markdown
### [ ] P2-V: Phase 2 연결점 검증 요약
- **담당**: test-specialist
- **범위**: P2의 모든 화면
- **검증 요약**:
  | 화면 | API | 네비게이션 | Auth | 공통 컴포넌트 |
  |------|-----|----------|------|-------------|
  | 상품 목록 | 2/2 | 1/1 | 1/1 | 2/2 |
  | 상품 상세 | 3/3 | 2/2 | 2/2 | 2/2 |
  | 장바구니 | 2/2 | 1/1 | 1/1 | 2/2 |
- **전체 통과 조건**: 모든 항목 ✅
```

---

## 자동화 검증 스크립트

CI/CD에서 자동으로 연결점 검증을 실행하는 스크립트:

```bash
#!/bin/bash
# scripts/verify-connections.sh

echo "🔗 연결점 검증 시작..."

# 1. API 엔드포인트 존재 검사
echo "📡 API 엔드포인트 검증..."
npx ts-node scripts/verify-api-endpoints.ts

# 2. 네비게이션 링크 검사
echo "🔗 네비게이션 검증..."
npx ts-node scripts/verify-navigation.ts

# 3. Auth 일관성 검사
echo "🔐 Auth 일관성 검증..."
npx ts-node scripts/verify-auth-consistency.ts

# 4. 타입 일치 검사
echo "📝 타입 일치 검증..."
npx tsc --noEmit

# 5. 시드 데이터 검사
echo "🌱 시드 데이터 검증..."
npx ts-node scripts/verify-seed-data.ts

echo "✅ 연결점 검증 완료!"
```

---

## 검증 실패 시 대응

### 실패 유형별 자동 수정 가이드

| 실패 유형 | 자동 감지 | 수정 가이드 |
|----------|----------|------------|
| API 404 | 엔드포인트 없음 | 라우트 파일 생성 필요 |
| 타입 불일치 | Zod 검증 실패 | 스키마 또는 API 응답 수정 |
| Auth 불일치 | 여러 Auth 라이브러리 | 하나로 통일 필요 |
| Link 404 | 페이지 없음 | 페이지 생성 또는 링크 제거 |
| 시드 불일치 | UUID 형식 오류 | crypto.randomUUID() 사용 |

### 검증 결과 리포트

```markdown
## 연결점 검증 리포트

### 요약
- **총 검증 항목**: 42개
- **통과**: 38개 (90%)
- **실패**: 4개 (10%)

### 실패 항목

| 화면 | 유형 | 항목 | 상태 | 수정 방법 |
|------|------|------|------|----------|
| 장바구니 | Auth | getUser() | ❌ | supabase → NextAuth로 변경 |
| 푸터 | Link | /about | ❌ | pages/about.tsx 생성 |
| 시드 | Type | product.id | ❌ | UUID 형식으로 변경 |
| 결제 | API | /api/checkout | ❌ | 라우트 생성 |

### 권장 조치
1. Auth 라이브러리 통일 (NextAuth 사용)
2. 누락된 페이지 생성
3. 시드 데이터 UUID 수정
```
