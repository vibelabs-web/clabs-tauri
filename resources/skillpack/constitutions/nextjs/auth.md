# Next.js Auth 헌법

> NextAuth.js (Auth.js) 사용 시 필수 규칙
> **vibeShop Auth 불일치 사례에서 도출된 검증된 패턴**

---

## 필수 규칙 (MUST)

### 1. 단일 Auth 레이어 사용

```typescript
// lib/auth.ts - 프로젝트 전체에서 이것만 사용
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
```

### 2. 모든 보호된 API에서 동일한 함수 사용

```typescript
// app/api/cart/route.ts
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... 로직
}
```

### 3. 클라이언트에서는 useSession만 사용

```typescript
// components/UserMenu.tsx
"use client";
import { useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") return <Skeleton />;
  if (!session) return <LoginButton />;

  return <UserDropdown user={session.user} />;
}
```

---

## 금지 패턴 (NEVER)

### 1. Supabase Auth 직접 호출 금지

```typescript
// ❌ 절대 금지 - NextAuth와 혼용 금지
import { supabase } from "@/lib/supabase";
const { data: { user } } = await supabase.auth.getUser();

// ❌ 절대 금지
const { data: { session } } = await supabase.auth.getSession();
```

### 2. API마다 다른 인증 체크 금지

```typescript
// ❌ 금지 - API마다 다른 방식
// api/products/route.ts
const session = await getServerSession(authOptions);

// api/cart/route.ts
const { data: { user } } = await supabase.auth.getUser(); // 불일치!
```

### 3. 클라이언트에서 getServerSession 호출 금지

```typescript
// ❌ 금지 - 서버 전용 함수를 클라이언트에서 호출
"use client";
import { getServerSession } from "next-auth"; // 에러 발생
```

---

## 올바른 패턴

### API Route 보호 패턴

```typescript
// app/api/protected/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 사용자 ID 사용
  const data = await fetchUserData(user.id);
  return NextResponse.json(data);
}
```

### Server Component 보호 패턴

```typescript
// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <Dashboard userId={user.id} />;
}
```

### Middleware 보호 패턴

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

---

## Supabase와 함께 사용할 때

> NextAuth로 인증, Supabase는 DB만 사용

### 올바른 구조

```
인증: NextAuth.js (Google, GitHub 등)
    ↓
세션: NextAuth Session (JWT)
    ↓
DB: Supabase (service_role로 접근, RLS는 user_id로)
```

### 설정 예시

```typescript
// lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

// 서버에서만 사용 - service_role 키
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // 절대 클라이언트에 노출 금지
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

```typescript
// app/api/products/route.ts
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const user = await getCurrentUser();

  // NextAuth 사용자 ID로 Supabase 쿼리
  const { data } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("user_id", user?.id);

  return NextResponse.json(data);
}
```

---

## 위반 감지 방법

### 1. Supabase Auth 사용 감지

```bash
# 프로젝트에서 supabase.auth 사용 여부 검사
grep -r "supabase\.auth\." --include="*.ts" --include="*.tsx" .

# 결과가 있으면 헌법 위반
```

### 2. Auth 일관성 검사

```bash
# getServerSession과 supabase.auth 혼용 검사
grep -l "getServerSession" --include="*.ts" . > nextauth_files.txt
grep -l "supabase.auth" --include="*.ts" . > supabase_files.txt

# 교집합이 있으면 헌법 위반
```

### 3. 자동화 스크립트

```typescript
// scripts/verify-auth-constitution.ts
import { glob } from "glob";
import * as fs from "fs";

async function verifyAuthConstitution() {
  const files = await glob("**/*.{ts,tsx}", { ignore: "node_modules/**" });
  const violations: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");

    // 위반 패턴 검사
    if (content.includes("supabase.auth.getUser")) {
      violations.push(`${file}: supabase.auth.getUser() 사용 금지`);
    }
    if (content.includes("supabase.auth.getSession")) {
      violations.push(`${file}: supabase.auth.getSession() 사용 금지`);
    }
  }

  if (violations.length > 0) {
    console.error("❌ Auth 헌법 위반 발견:");
    violations.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }

  console.log("✅ Auth 헌법 검증 통과");
}

verifyAuthConstitution();
```

---

## 마이그레이션 체크리스트

Supabase Auth → NextAuth.js 마이그레이션 시:

- [ ] `lib/auth.ts` 생성 (getCurrentUser, requireAuth)
- [ ] 모든 `supabase.auth.getUser()` → `getCurrentUser()`
- [ ] 모든 `supabase.auth.getSession()` → `getServerSession()`
- [ ] 클라이언트 `supabase.auth` → `useSession()`
- [ ] RLS 정책 user_id → NextAuth user.id 매핑
- [ ] 위반 감지 스크립트 실행
