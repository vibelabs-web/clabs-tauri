# Supabase Auth Integration 헌법

> Supabase를 외부 Auth(NextAuth, Firebase 등)와 함께 사용할 때 규칙
> **혼용으로 인한 Auth 불일치 방지**

---

## 핵심 원칙

```
┌─────────────────────────────────────────────────────────────────┐
│  하나의 프로젝트에서 Auth 시스템은 반드시 하나만 사용!          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Supabase Auth만 사용                                        │
│  ✅ NextAuth.js만 사용 (Supabase는 DB만)                        │
│  ✅ Firebase Auth만 사용 (Supabase는 DB만)                      │
│                                                                 │
│  ❌ Supabase Auth + NextAuth.js 혼용                            │
│  ❌ 화면마다 다른 Auth 시스템                                   │
│  ❌ API마다 다른 인증 체크                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 시나리오별 가이드

### 시나리오 A: Supabase Auth만 사용

**언제**: 소셜 로그인(Google, GitHub 등)을 Supabase에서 처리할 때

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// 클라이언트용 (anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 사용
const { data: { user } } = await supabase.auth.getUser();
```

```typescript
// 클라이언트에서
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
});

// 서버에서
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**RLS**: `auth.uid()` 사용 가능

```sql
CREATE POLICY "user_data" ON products
FOR ALL TO authenticated
USING (user_id = auth.uid());
```

---

### 시나리오 B: NextAuth.js + Supabase DB

**언제**: NextAuth.js로 인증하고, Supabase는 DB만 사용할 때

```typescript
// lib/auth.ts - NextAuth 전용
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
```

```typescript
// lib/supabase-admin.ts - 서버 전용 (service_role)
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

```typescript
// API에서 사용
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // NextAuth user.id로 필터링
  const { data } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("user_id", user.id);

  return NextResponse.json(data);
}
```

**RLS**: `auth.uid()` 사용 불가 → 서버에서 필터링

```sql
-- RLS는 활성화하되, service_role이 우회
-- 또는 커스텀 JWT 방식 사용
```

---

## 금지 패턴 (NEVER)

### 1. 두 Auth 시스템 혼용 금지

```typescript
// ❌ 금지 - 같은 프로젝트에서 혼용
// api/products/route.ts
import { getCurrentUser } from "@/lib/auth"; // NextAuth

// api/cart/route.ts
const { data: { user } } = await supabase.auth.getUser(); // Supabase Auth
```

### 2. 클라이언트에서 두 Auth 동시 사용 금지

```typescript
// ❌ 금지
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

function Component() {
  const { data: session } = useSession(); // NextAuth
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user); // Supabase Auth - 혼란!
    });
  }, []);
}
```

### 3. RLS에서 auth.uid()를 NextAuth와 함께 사용 금지

```sql
-- ❌ 금지 - NextAuth 사용 시 auth.uid()는 null
CREATE POLICY "user_data" ON products
FOR SELECT TO authenticated
USING (user_id = auth.uid()); -- NextAuth에서는 작동 안 함!
```

---

## 마이그레이션 가이드

### Supabase Auth → NextAuth.js

#### 1단계: NextAuth 설정

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### 2단계: 단일 Auth 레이어 생성

```typescript
// lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
```

#### 3단계: 모든 Supabase Auth 호출 교체

```bash
# 교체 대상 찾기
grep -rn "supabase.auth" --include="*.ts" --include="*.tsx" .
```

| 이전 | 이후 |
|------|------|
| `supabase.auth.getUser()` | `getCurrentUser()` |
| `supabase.auth.getSession()` | `getServerSession(authOptions)` |
| `supabase.auth.signInWithOAuth()` | `signIn("google")` |
| `supabase.auth.signOut()` | `signOut()` |
| `useSupabaseUser()` | `useSession()` |

#### 4단계: Supabase Admin 클라이언트 생성

```typescript
// lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

#### 5단계: API 수정

```typescript
// 이전
export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data } = await supabase.from("products").select("*");
  return NextResponse.json(data);
}

// 이후
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { data } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("user_id", user.id); // 명시적 필터링

  return NextResponse.json(data);
}
```

#### 6단계: 검증

```bash
# Supabase Auth 잔존 검사
grep -rn "supabase.auth" --include="*.ts" --include="*.tsx" .

# 결과가 없어야 함
```

---

## 체크리스트

마이그레이션 완료 확인:

- [ ] 모든 `supabase.auth.*` 호출 제거
- [ ] 단일 `lib/auth.ts` 생성
- [ ] 모든 API가 `getCurrentUser()` 사용
- [ ] 클라이언트가 `useSession()` 사용
- [ ] `supabaseAdmin` 클라이언트 서버 전용
- [ ] `.env`에 `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` 없음
- [ ] RLS 정책이 적절히 업데이트됨 (또는 서버 필터링)
