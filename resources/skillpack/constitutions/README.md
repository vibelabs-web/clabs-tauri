# Framework Constitutions

> 프레임워크별 필수 규칙 및 베스트 프랙티스
> **위반 시 즉시 경고 또는 실패 처리**

---

## 왜 헌법이 필요한가?

### vibeShop 실패 사례

| 실패 | 원인 | 헌법으로 방지 |
|------|------|--------------|
| Cart API 500 에러 | NextAuth.js 마이그레이션 후 supabase.auth.getUser() 잔존 | `nextjs/auth.md` |
| Zod 검증 실패 | 시드 UUID가 RFC 4122 미준수 | `common/uuid.md` |
| RLS 우회 취약점 | service_role 키 클라이언트 노출 | `supabase/rls.md` |
| 화면 종속 API | `/api/screens/product-list` 패턴 사용 | `*/api-design.md` |
| CSS 미적용 | Tailwind v4인데 v3 문법 사용 | `tailwind/v4-syntax.md` |
| CORS 에러 (가짜) | FastAPI에서 .env 미로드 → 500 에러 | `fastapi/dotenv.md` ⭐ |

### 반복되는 실수

```
매 프로젝트마다:
- Supabase Auth + NextAuth 혼용
- API Route에서 인증 체크 누락
- RLS 정책 없이 배포
- 시드 데이터 UUID 형식 오류
- 화면명 URL 패턴 사용 (/api/screens/*)
- 포맷된 응답 반환 (price: "10,000원")
- Tailwind v4인데 v3 문법 사용 (@tailwind base 등)
- FastAPI에서 .env 미로드 → CORS 에러로 착각 ⭐ NEW!
```

**헌법 = 검증된 패턴의 강제 적용**

---

## 폴더 구조

```
.claude/constitutions/
├── README.md               # 이 파일
├── nextjs/
│   ├── auth.md             # NextAuth 필수 패턴
│   ├── api-routes.md       # App Router API 규칙
│   └── api-design.md       # ⭐ Resource-Oriented API Design
├── supabase/
│   ├── rls.md              # Row Level Security 필수 규칙
│   └── auth-integration.md # 외부 Auth 연동
├── fastapi/
│   ├── auth.md             # JWT + OAuth2 패턴
│   ├── dependencies.md     # Dependency Injection
│   ├── api-design.md       # Resource-Oriented API Design
│   └── dotenv.md           # ⭐ .env 파일 로드 필수!
├── tailwind/               # ⭐ NEW!
│   └── v4-syntax.md        # Tailwind v4 문법 규칙
└── common/
    ├── uuid.md             # RFC 4122 준수
    └── seed-validation.md  # Seed ↔ Schema 일치
```

---

## ⭐ API Design 헌법 (v2.0 신규!)

> "백엔드 API는 화면에 종속되지 않는다"

### 핵심 규칙 (MUST)

1. **RESTful 엔드포인트**: `GET /api/products`, `POST /api/products`
2. **복수형 명사**: `/api/products`, `/api/categories`
3. **Raw 데이터 반환**: `price: 10000` (not `"10,000원"`)
4. **중첩 리소스 2단계 이하**: `/api/orders/{id}/items`

### 금지 패턴 (NEVER)

| 패턴 | 이유 | 올바른 패턴 |
|------|------|------------|
| `/api/screens/product-list` | 화면 종속 | `/api/products` |
| `/api/home-page-data` | Aggregate 엔드포인트 | 개별 리소스 API |
| `price: "10,000원"` | 포맷된 응답 | `price: 10000` |
| `"장바구니에 추가 실패"` | 화면 전용 에러 | `code: "INSUFFICIENT_STOCK"` |

### 위반 감지

```bash
# 화면명 URL 패턴 검출
grep -rn "screens\|pages\|views" --include="*.py" app/api/
grep -rn "screens\|pages\|views" --include="*.ts" app/api/

# 예상 결과: 매치 없어야 함
```

상세: [FastAPI API Design](./fastapi/api-design.md) | [Next.js API Design](./nextjs/api-design.md)

---

## 사용 방법

### 1. 에이전트가 자동으로 참조

전문가 에이전트(backend-specialist, frontend-specialist 등)가 코드 생성 시 해당 프레임워크의 헌법을 자동으로 읽고 준수합니다.

```markdown
## Resource 태스크
- **헌법**: `constitutions/fastapi/api-design.md` 준수
```

### 2. 연결점 검증에서 활용

`/tasks-generator`가 생성하는 연결점 검증 태스크에서 헌법 위반 여부를 체크합니다.

### 3. 코드 리뷰에서 활용

`/code-review` 스킬이 헌법 위반 패턴을 감지하고 경고합니다.

---

## 헌법 문서 형식

각 헌법 문서는 다음 구조를 따릅니다:

```markdown
# {프레임워크} {영역} 헌법

## 필수 규칙 (MUST)
위반 시 즉시 실패 처리되는 규칙

## 권장 규칙 (SHOULD)
권장하지만 상황에 따라 예외 허용

## 금지 패턴 (NEVER)
절대 사용하면 안 되는 패턴

## 올바른 패턴
복사해서 바로 사용할 수 있는 코드

## 위반 감지 방법
grep, AST 분석 등 자동 감지 방법
```

---

## 헌법 목록

### FastAPI

| 헌법 | 설명 | 핵심 규칙 |
|------|------|----------|
| [auth.md](./fastapi/auth.md) | JWT + OAuth2 패턴 | Bearer 토큰, 의존성 주입 |
| [dependencies.md](./fastapi/dependencies.md) | Dependency Injection | 서비스 레이어 분리 |
| [api-design.md](./fastapi/api-design.md) | **API 설계 규칙** | 화면 비종속, Raw 데이터 |
| [dotenv.md](./fastapi/dotenv.md) | **.env 파일 로드** | `load_dotenv()` 필수, Pydantic Settings 권장 |

### Next.js

| 헌법 | 설명 | 핵심 규칙 |
|------|------|----------|
| [auth.md](./nextjs/auth.md) | NextAuth 필수 패턴 | 세션 관리, 미들웨어 |
| [api-routes.md](./nextjs/api-routes.md) | App Router API 규칙 | route.ts 구조 |
| [api-design.md](./nextjs/api-design.md) | **API 설계 규칙** | 화면 비종속, Raw 데이터 |

### Supabase

| 헌법 | 설명 | 핵심 규칙 |
|------|------|----------|
| [rls.md](./supabase/rls.md) | Row Level Security | 정책 필수 적용 |
| [auth-integration.md](./supabase/auth-integration.md) | 외부 Auth 연동 | 토큰 동기화 |

### Tailwind CSS

| 헌법 | 설명 | 핵심 규칙 |
|------|------|----------|
| [v4-syntax.md](./tailwind/v4-syntax.md) | **v4 문법 규칙** | `@import "tailwindcss"`, config 파일 불필요 |

### Common

| 헌법 | 설명 | 핵심 규칙 |
|------|------|----------|
| [uuid.md](./common/uuid.md) | RFC 4122 준수 | 유효한 UUID 형식 |
| [seed-validation.md](./common/seed-validation.md) | Seed ↔ Schema 일치 | Zod 검증 통과 |

---

## 헌법 추가하기

새 프레임워크나 영역의 헌법을 추가하려면:

1. 해당 폴더에 `.md` 파일 생성
2. 위 형식에 맞춰 규칙 작성
3. 위반 감지 방법 포함
4. 이 README의 폴더 구조 및 헌법 목록 업데이트

---

## 관련 문서

- [Domain Resource Validation](../skills/tasks-generator/references/domain-resource-validation.md)
- [화면 명세 스키마 v2.0](../skills/screen-spec/references/schema.md)
- [Tasks 문서 생성 규칙 v2.0](../skills/tasks-generator/references/tasks-rules.md)
