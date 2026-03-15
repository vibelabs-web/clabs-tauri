# Context7 라이브러리 ID 레퍼런스

> 자주 사용하는 라이브러리의 Context7 ID 목록

## Frontend

### React 생태계

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| React | /facebook/react | UI 라이브러리 |
| Next.js | /vercel/next.js | React 풀스택 프레임워크 |
| Remix | /remix-run/remix | React 풀스택 프레임워크 |
| Gatsby | /gatsbyjs/gatsby | React 정적 사이트 |

### 상태 관리

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| Zustand | /pmndrs/zustand | 경량 상태 관리 |
| Jotai | /pmndrs/jotai | 원자적 상태 관리 |
| TanStack Query | /tanstack/query | 서버 상태 관리 |
| Redux Toolkit | /reduxjs/redux-toolkit | 전역 상태 관리 |

### UI 컴포넌트

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| shadcn/ui | /shadcn-ui/ui | Radix 기반 컴포넌트 |
| Radix UI | /radix-ui/primitives | 헤드리스 컴포넌트 |
| Headless UI | /tailwindlabs/headlessui | 헤드리스 컴포넌트 |
| Chakra UI | /chakra-ui/chakra-ui | 스타일 컴포넌트 |

### 애니메이션

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| Framer Motion | /framer/motion | React 애니메이션 |
| React Spring | /pmndrs/react-spring | 물리 기반 애니메이션 |
| GSAP | /greensock/GSAP | 고성능 애니메이션 |

### 기타 프레임워크

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| Vue | /vuejs/core | Vue 3 |
| Nuxt | /nuxt/nuxt | Vue 풀스택 |
| Svelte | /sveltejs/svelte | Svelte 5 |
| SvelteKit | /sveltejs/kit | Svelte 풀스택 |
| Astro | /withastro/astro | 콘텐츠 중심 프레임워크 |

---

## Backend

### Python

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| FastAPI | /tiangolo/fastapi | 고성능 API |
| Pydantic | /pydantic/pydantic | 데이터 검증 |
| SQLAlchemy | /sqlalchemy/sqlalchemy | ORM |
| Alembic | /sqlalchemy/alembic | DB 마이그레이션 |
| Celery | /celery/celery | 태스크 큐 |
| Pytest | /pytest-dev/pytest | 테스팅 |

### Node.js

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| Express | /expressjs/express | 웹 프레임워크 |
| Fastify | /fastify/fastify | 고성능 웹 프레임워크 |
| NestJS | /nestjs/nest | 엔터프라이즈 프레임워크 |
| Hono | /honojs/hono | 경량 프레임워크 |

### Go

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| Echo | /labstack/echo | 웹 프레임워크 |
| Gin | /gin-gonic/gin | 웹 프레임워크 |
| Fiber | /gofiber/fiber | Express 스타일 프레임워크 |

---

## Database

### ORM / Query Builder

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| Prisma | /prisma/prisma | TypeScript ORM |
| Drizzle | /drizzle-team/drizzle-orm | TypeScript ORM |
| Kysely | /kysely-org/kysely | 타입세이프 SQL |
| TypeORM | /typeorm/typeorm | TypeScript ORM |

### 데이터베이스 클라이언트

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| Supabase | /supabase/supabase | Postgres + Auth + Storage |
| PlanetScale | /planetscale/database-js | MySQL 서버리스 |
| MongoDB | /mongodb/node-mongodb-native | MongoDB 드라이버 |
| Redis | /redis/node-redis | Redis 클라이언트 |

---

## Testing

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| Vitest | /vitest-dev/vitest | Vite 네이티브 테스트 |
| Jest | /jestjs/jest | JavaScript 테스트 |
| Playwright | /microsoft/playwright | E2E 테스트 |
| Cypress | /cypress-io/cypress | E2E 테스트 |
| Testing Library | /testing-library/react-testing-library | React 테스트 |
| MSW | /mswjs/msw | API 모킹 |

---

## DevOps / Infra

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| Docker | /docker/docs | 컨테이너 |
| Terraform | /hashicorp/terraform | IaC |
| Kubernetes | /kubernetes/kubernetes | 오케스트레이션 |

---

## AI / ML

| 라이브러리 | Context7 ID | 용도 |
|-----------|-------------|------|
| LangChain | /langchain-ai/langchain | LLM 프레임워크 |
| OpenAI | /openai/openai-python | OpenAI API |
| Vercel AI SDK | /vercel/ai | AI 스트리밍 |
| Transformers | /huggingface/transformers | ML 모델 |

---

## 사용 예시

### resolve-library-id 호출

```json
{
  "libraryName": "react",
  "query": "use hook data fetching suspense"
}
```

### query-docs 호출

```json
{
  "libraryId": "/facebook/react",
  "query": "use hook async data fetching with suspense example"
}
```

---

## 버전 지정

특정 버전 문서가 필요한 경우:

```
/vercel/next.js/v14.2.0  → Next.js 14.2.0 문서
/vercel/next.js/v15.0.0  → Next.js 15.0.0 문서
```

---

## 주의사항

1. **ID 변경 가능**: Context7 ID는 변경될 수 있음
2. **resolve-library-id 우선**: 항상 resolve로 최신 ID 확인 권장
3. **호출 제한**: 질문당 최대 3회 API 호출
