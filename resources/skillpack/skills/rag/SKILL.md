---
name: rag
description: Context7 MCP를 통해 최신 라이브러리 문서 검색 후 정확한 코드 생성. 모든 전문가 에이전트에서 자동 활용.
trigger: 코드 작성 시 자동 (최신 버전 명시, 새 API 언급, 모르는 라이브러리)
---

# RAG (Retrieval Augmented Generation) Skill

> 최신 라이브러리 문서를 검색하여 정확한 코드 생성

## 개요

RAG 패턴을 적용하여 Context7 MCP를 통해 최신 문서를 검색하고, 이를 기반으로 정확한 코드를 생성합니다.

**문제**: LLM 학습 데이터는 과거 시점으로 고정되어 최신 API 변경사항을 모름
**해결**: 실시간 문서 검색으로 최신 정보 기반 코드 생성

---

## 워크플로우

```
사용자 요청
    ↓
1. 라이브러리 감지
   - 코드에서 import/require 분석
   - package.json, requirements.txt 확인
    ↓
2. 문서 검색 (Context7 MCP)
   - resolve-library-id로 라이브러리 ID 획득
   - query-docs로 관련 문서 검색
    ↓
3. 컨텍스트 증강
   - 검색된 문서를 프롬프트에 추가
   - 최신 API 시그니처 반영
    ↓
4. 코드 생성
   - 검색된 문서 기반 코드 작성
   - 출처 주석으로 투명성 확보
```

---

## 사용법

### 자동 모드 (권장)

코드 작성 시 자동으로 최신 문서 참조:

```
"React 19의 use hook으로 데이터 fetching 구현해줘"
```

→ Context7에서 React 19 문서 자동 검색 후 코드 생성

### 명시적 모드

특정 라이브러리 버전 문서 검색:

```
"/rag fastapi 0.115 인증 미들웨어"
"/rag next.js 15 app router 동적 라우팅"
"/rag tanstack-query v5 infinite scroll"
```

---

## 실행 규칙

### 1. 라이브러리 감지

코드 작성 전 다음을 분석:

```python
# Python
import fastapi  # → /tiangolo/fastapi
from pydantic import BaseModel  # → /pydantic/pydantic

# TypeScript
import { useQuery } from '@tanstack/react-query'  # → /tanstack/query
import { motion } from 'framer-motion'  # → /framer/motion
```

### 2. Context7 MCP 호출

**Step 1: 라이브러리 ID 획득**

```
mcp__context7__resolve-library-id
- libraryName: "react"
- query: "use hook data fetching"
```

**Step 2: 문서 검색**

```
mcp__context7__query-docs
- libraryId: "/facebook/react"
- query: "use hook async data fetching example"
```

### 3. 코드 생성 시 출처 표기

```typescript
// @RAG-SOURCE: Context7 /facebook/react - "use hook"
// @DOC-VERSION: React 19.0.0 (2024-12)
import { use } from 'react';

async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

function UserProfile({ userPromise }) {
  // React 19의 use() hook으로 Promise 직접 소비
  const user = use(userPromise);
  return <div>{user.name}</div>;
}
```

---

## 자동 트리거 조건

다음 상황에서 RAG 자동 실행:

| 조건 | 예시 |
|------|------|
| 최신 버전 명시 | "React 19", "Next.js 15", "Svelte 5" |
| 새로운 API 언급 | "use hook", "Server Actions", "Runes" |
| 베타/실험적 기능 | "experimental", "canary", "beta" |
| 마이그레이션 | "v4에서 v5로", "업그레이드" |
| 모르는 라이브러리 | 처음 보는 패키지명 |

---

## 지원 라이브러리 (자주 사용)

| 카테고리 | 라이브러리 | Context7 ID |
|----------|-----------|-------------|
| **React** | React | /facebook/react |
| | Next.js | /vercel/next.js |
| | TanStack Query | /tanstack/query |
| | Zustand | /pmndrs/zustand |
| **Python** | FastAPI | /tiangolo/fastapi |
| | Pydantic | /pydantic/pydantic |
| | SQLAlchemy | /sqlalchemy/sqlalchemy |
| **Database** | Prisma | /prisma/prisma |
| | Drizzle | /drizzle-team/drizzle-orm |
| | Supabase | /supabase/supabase |
| **Testing** | Vitest | /vitest-dev/vitest |
| | Playwright | /microsoft/playwright |
| | Pytest | /pytest-dev/pytest |

---

## 캐싱 전략

### 세션 내 캐싱

동일 라이브러리 문서는 세션 내 재사용:

```
첫 번째 요청: React use hook → Context7 API 호출 (500ms)
두 번째 요청: React useState → 캐시 사용 (즉시)
```

### 버전 고정

특정 버전 문서 고정 가능:

```
/rag next.js@14.2.0 middleware
```

→ Next.js 14.2.0 문서만 검색 (15.x 제외)

---

## 에러 처리

### 라이브러리를 찾을 수 없는 경우

```markdown
⚠️ Context7에서 'some-obscure-lib' 문서를 찾을 수 없습니다.

대안:
1. npm/PyPI 공식 문서 확인
2. GitHub README 참조
3. 기존 학습 데이터 기반 코드 생성 (주의 필요)
```

### API 응답 없음

```markdown
⚠️ Context7 API 응답 없음

폴백:
1. 기존 학습 데이터 사용
2. 코드에 버전 주의 주석 추가
```

---

## 다른 에이전트와 통합

### backend-specialist

```markdown
FastAPI 엔드포인트 작성 시:
1. /tiangolo/fastapi 문서 검색
2. 최신 Depends, APIRouter 패턴 적용
3. @RAG-SOURCE 주석 추가
```

### frontend-specialist

```markdown
React 컴포넌트 작성 시:
1. /facebook/react + /vercel/next.js 문서 검색
2. 최신 Hook 패턴 적용
3. 서버 컴포넌트 vs 클라이언트 컴포넌트 구분
```

### test-specialist

```markdown
테스트 코드 작성 시:
1. /vitest-dev/vitest 또는 /pytest-dev/pytest 검색
2. 최신 matcher, mock 패턴 적용
3. 프레임워크별 best practice 반영
```

---

## 출력 예시

### 검색 결과 요약

```markdown
## RAG 검색 결과

**라이브러리**: Next.js 15
**쿼리**: "Server Actions form submission"
**문서 버전**: 15.0.3 (2024-12)

### 핵심 정보
- Server Actions는 'use server' 지시어 사용
- form의 action 속성에 직접 할당 가능
- useFormStatus, useFormState 훅 제공

### 코드 예시 (문서 기반)
...
```

### 생성된 코드

```typescript
// @RAG-SOURCE: Context7 /vercel/next.js - "Server Actions"
// @DOC-VERSION: Next.js 15.0.3 (2024-12)
// @TASK T2.1 - 폼 제출 처리

'use server'

export async function submitForm(formData: FormData) {
  const email = formData.get('email');
  // Server Action 로직
}
```

---

## 주의사항

1. **API 호출 제한**: Context7 호출은 질문당 최대 3회
2. **캐시 활용**: 동일 라이브러리는 캐시 우선 사용
3. **폴백 준비**: API 실패 시 기존 지식 기반 코드 생성
4. **버전 명시**: 생성된 코드에 항상 버전 정보 포함

---

## 참고

- Context7 MCP: `.mcp.json`에 설정됨
- 자동 실행: 에이전트가 코드 작성 시 필요에 따라 호출
- 수동 실행: `/rag [라이브러리] [쿼리]` 형식
