# Supabase RLS 헌법

> Row Level Security 필수 규칙
> **RLS 없이 배포하면 전체 데이터 노출 위험**

---

## 필수 규칙 (MUST)

### 1. 모든 테이블에 RLS 활성화

```sql
-- 테이블 생성 시 항상 RLS 활성화
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 (필수!)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### 2. 기본 정책: 거부

RLS 활성화 후 정책이 없으면 모든 접근이 거부됩니다. 이것이 기본 동작입니다.

```sql
-- 정책 없으면 → 모든 SELECT, INSERT, UPDATE, DELETE 거부
-- 이것이 안전한 기본값
```

### 3. 명시적 정책 정의

```sql
-- SELECT: 자신의 데이터만 조회
CREATE POLICY "Users can view own products"
ON products FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: 자신의 데이터만 생성
CREATE POLICY "Users can create own products"
ON products FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: 자신의 데이터만 수정
CREATE POLICY "Users can update own products"
ON products FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: 자신의 데이터만 삭제
CREATE POLICY "Users can delete own products"
ON products FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

### 4. 공개 데이터는 명시적으로

```sql
-- 공개 데이터도 명시적 정책 필요
CREATE POLICY "Anyone can view published products"
ON products FOR SELECT
TO anon, authenticated
USING (is_published = true);
```

---

## 금지 패턴 (NEVER)

### 1. service_role 키 클라이언트 노출 금지

```typescript
// ❌ 절대 금지 - 클라이언트에 service_role 노출
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 절대 금지!
);
```

```env
# ❌ 금지
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=... # NEXT_PUBLIC_ 접두사 금지!
```

### 2. RLS 비활성화 상태로 배포 금지

```sql
-- ❌ 금지 - RLS 비활성화
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- ❌ 금지 - RLS 없이 테이블 생성 후 방치
CREATE TABLE orders (...);
-- RLS 활성화 안 함 → 전체 데이터 노출!
```

### 3. 과도하게 허용적인 정책 금지

```sql
-- ❌ 금지 - 모든 사용자가 모든 데이터 접근
CREATE POLICY "Everyone can do everything"
ON products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ❌ 금지 - anon에게 쓰기 권한
CREATE POLICY "Anonymous can insert"
ON products FOR INSERT
TO anon
WITH CHECK (true);
```

---

## 올바른 패턴

### 표준 사용자 데이터 정책

```sql
-- 사용자별 데이터 격리 (가장 일반적)
CREATE POLICY "user_isolation_select" ON user_data
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_isolation_insert" ON user_data
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_update" ON user_data
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation_delete" ON user_data
FOR DELETE TO authenticated
USING (user_id = auth.uid());
```

### 조직 기반 접근 제어

```sql
-- 같은 조직 멤버만 접근
CREATE POLICY "org_members_access" ON projects
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = projects.org_id
    AND org_members.user_id = auth.uid()
  )
);
```

### 역할 기반 접근 제어

```sql
-- 관리자는 모든 데이터 접근
CREATE POLICY "admin_full_access" ON products
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 일반 사용자는 자기 데이터만
CREATE POLICY "user_own_data" ON products
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### 공개 + 비공개 혼합

```sql
-- 공개 게시물은 누구나 조회
CREATE POLICY "public_posts_read" ON posts
FOR SELECT TO anon, authenticated
USING (status = 'published');

-- 비공개 게시물은 작성자만 조회
CREATE POLICY "private_posts_owner_read" ON posts
FOR SELECT TO authenticated
USING (status = 'draft' AND author_id = auth.uid());

-- 작성/수정/삭제는 작성자만
CREATE POLICY "posts_owner_write" ON posts
FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_owner_update" ON posts
FOR UPDATE TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "posts_owner_delete" ON posts
FOR DELETE TO authenticated
USING (author_id = auth.uid());
```

---

## NextAuth.js와 함께 사용

NextAuth.js 사용 시 `auth.uid()`가 없으므로 다른 방식 필요:

### 방법 1: Service Role + 서버에서 필터링

```typescript
// 서버에서 service_role로 접근하고, user_id로 필터링
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  // NextAuth user.id로 필터링
  const { data } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("user_id", user.id);

  return NextResponse.json(data);
}
```

### 방법 2: 커스텀 JWT + RLS

```sql
-- Supabase에서 커스텀 claim 읽기
CREATE POLICY "nextauth_user_access" ON products
FOR ALL TO authenticated
USING (
  user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
);
```

---

## 위반 감지 방법

### 1. RLS 비활성화 테이블 검사

```sql
-- RLS가 비활성화된 테이블 찾기
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
```

### 2. 정책 없는 테이블 검사

```sql
-- RLS 활성화됐지만 정책이 없는 테이블
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0;
```

### 3. 자동화 스크립트

```typescript
// scripts/verify-rls.ts
import { supabaseAdmin } from "@/lib/supabase-admin";

async function verifyRLS() {
  // RLS 비활성화 테이블 검사
  const { data: tables } = await supabaseAdmin.rpc("get_tables_without_rls");

  if (tables && tables.length > 0) {
    console.error("❌ RLS 비활성화 테이블 발견:");
    tables.forEach((t: any) => console.error(`  - ${t.tablename}`));
    process.exit(1);
  }

  console.log("✅ 모든 테이블 RLS 활성화 확인");
}
```

---

## 체크리스트

배포 전 확인:

- [ ] 모든 테이블 RLS 활성화
- [ ] 각 테이블에 최소 1개 이상 정책 존재
- [ ] service_role 키가 NEXT_PUBLIC_에 없음
- [ ] anon에게 쓰기 권한 없음 (의도적인 경우 제외)
- [ ] 과도하게 허용적인 정책(true) 없음
