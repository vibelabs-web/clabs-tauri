# TRD (기술 요구사항 정의서) 템플릿

> 개발자/AI 코딩 파트너가 참조하는 기술 문서입니다.
> 기술 표현을 사용하되, "왜 이 선택인지"를 함께 설명합니다.

---

## MVP 캡슐

| # | 항목 | 내용 |
|---|------|------|
| 1 | 목표 | {{목표}} |
| 2 | 페르소나 | {{페르소나}} |
| 3 | 핵심 기능 | {{FEAT-1: 핵심기능명}} |
| 4 | 성공 지표 (노스스타) | {{노스스타 지표}} |
| 5 | 입력 지표 | {{입력지표 1~2개}} |
| 6 | 비기능 요구 | {{최소 1개}} |
| 7 | Out-of-scope | {{이번엔 안 함}} |
| 8 | Top 리스크 | {{리스크 1개}} |
| 9 | 완화/실험 | {{완화책}} |
| 10 | 다음 단계 | {{바로 할 행동}} |

---

## 1. 시스템 아키텍처

### 1.1 고수준 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│  Database   │
│  (Frontend) │     │  (Backend)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 1.2 컴포넌트 설명

| 컴포넌트 | 역할 | 왜 이 선택? |
|----------|------|-------------|
| Frontend | {{역할}} | {{이유}} |
| Backend | {{역할}} | {{이유}} |
| Database | {{역할}} | {{이유}} |

---

## 2. 권장 기술 스택

### 2.1 프론트엔드

| 항목 | 선택 | 이유 | 벤더 락인 리스크 |
|------|------|------|-----------------|
| 프레임워크 | {{예: React}} | {{이유}} | {{낮음/중간/높음}} |
| 언어 | {{예: TypeScript}} | {{이유}} | - |
| 스타일링 | {{예: TailwindCSS}} | {{이유}} | 낮음 |
| 상태관리 | {{예: Zustand}} | {{이유}} | 낮음 |
| HTTP 클라이언트 | {{예: Axios}} | {{이유}} | 낮음 |

### 2.2 백엔드

| 항목 | 선택 | 이유 | 벤더 락인 리스크 |
|------|------|------|-----------------|
| 프레임워크 | {{예: FastAPI / Rails / Express}} | {{이유}} | 낮음 |
| 언어 | {{예: Python 3.11+ / Ruby 3.3+ / TypeScript}} | {{이유}} | - |
| ORM | {{예: SQLAlchemy 2.0 / ActiveRecord / Prisma}} | {{이유}} | 낮음 |
| 검증 | {{예: Pydantic v2 / Rails Validations / Zod}} | {{이유}} | 낮음 |

**권장 백엔드 조합:**

| 스택 | 언어 | 프레임워크 | ORM | 특징 |
|------|------|-----------|-----|------|
| Python | Python 3.11+ | FastAPI | SQLAlchemy 2.0 | 빠른 개발, 자동 API 문서 |
| Ruby | Ruby 3.3+ | Rails 8 | ActiveRecord | 컨벤션 기반, 빠른 프로토타이핑 |
| Node.js | TypeScript | Express / NestJS | Prisma | 풀스택 JS, 타입 안전성 |

### 2.3 데이터베이스

| 항목 | 선택 | 이유 |
|------|------|------|
| 메인 DB | {{예: PostgreSQL}} | {{이유}} |
| 캐시 | {{예: Redis (선택)}} | {{이유}} |

### 2.4 인프라

| 항목 | 선택 | 이유 |
|------|------|------|
| 컨테이너 | Docker + Docker Compose | 로컬 개발 일관성 |
| 호스팅 | {{예: Vercel / Railway}} | {{이유}} |

---

## 3. 비기능 요구사항

### 3.1 성능

| 항목 | 요구사항 | 측정 방법 |
|------|----------|----------|
| 응답 시간 | < 500ms (P95) | API 모니터링 |
| 초기 로딩 | < 3s (FCP) | Lighthouse |

### 3.2 보안

| 항목 | 요구사항 |
|------|----------|
| 인증 | {{예: JWT + Refresh Token}} |
| 비밀번호 | bcrypt 해싱 |
| HTTPS | 필수 |
| 입력 검증 | 서버 측 필수 |

### 3.3 확장성

| 항목 | 현재 | 목표 |
|------|------|------|
| 동시 사용자 | MVP: 100명 | v2: 1,000명 |
| 데이터 용량 | MVP: 1GB | v2: 10GB |

---

## 4. 외부 API 연동

### 4.1 인증

| 서비스 | 용도 | 필수/선택 | 연동 방식 |
|--------|------|----------|----------|
| {{예: Google OAuth}} | 소셜 로그인 | {{필수/선택}} | OAuth 2.0 |

### 4.2 기타 서비스

| 서비스 | 용도 | 필수/선택 | 비고 |
|--------|------|----------|------|
| {{서비스명}} | {{용도}} | {{필수/선택}} | {{비고}} |

---

## 5. 접근제어·권한 모델

### 5.1 역할 정의

| 역할 | 설명 | 권한 |
|------|------|------|
| Guest | 비로그인 | 읽기 전용 (공개 콘텐츠) |
| User | 일반 사용자 | CRUD (본인 데이터) |
| Admin | 관리자 | 전체 접근 |

### 5.2 권한 매트릭스

| 리소스 | Guest | User | Admin |
|--------|-------|------|-------|
| 프로필 조회 | - | O (본인) | O |
| 프로필 수정 | - | O (본인) | O |
| 데이터 생성 | - | O | O |
| 데이터 삭제 | - | O (본인) | O |

---

## 6. 데이터 생명주기

### 6.1 원칙

- **최소 수집**: 필요한 데이터만 수집
- **명시적 동의**: 개인정보 수집 전 동의
- **보존 기한**: 목적 달성 후 삭제

### 6.2 데이터 흐름

```
수집 → 저장 → 사용 → 보관 → 삭제/익명화
```

| 데이터 유형 | 보존 기간 | 삭제/익명화 |
|------------|----------|------------|
| 계정 정보 | 탈퇴 후 30일 | 완전 삭제 |
| 활동 로그 | 1년 | 익명화 |
| 분석 데이터 | 영구 | 익명화된 상태로 보관 |

---

## 7. 테스트 전략 (Contract-First TDD)

### 7.1 개발 방식: Contract-First Development

본 프로젝트는 **계약 우선 개발(Contract-First Development)** 방식을 채택합니다.
BE/FE가 독립적으로 병렬 개발하면서도 통합 시 호환성을 보장합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    Contract-First 흐름                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 계약 정의 (Phase 0)                                     │
│     ├─ API 계약: contracts/*.contract.ts                   │
│     ├─ BE 스키마: backend/app/schemas/*.py                 │
│     └─ 타입 동기화: TypeScript ↔ Pydantic                  │
│                                                             │
│  2. 테스트 선행 작성 (🔴 RED)                               │
│     ├─ BE 테스트: tests/api/*.py                           │
│     ├─ FE 테스트: src/__tests__/**/*.test.ts               │
│     └─ 모든 테스트가 실패하는 상태 (정상!)                  │
│                                                             │
│  3. Mock 생성 (FE 독립 개발용)                              │
│     └─ MSW 핸들러: src/mocks/handlers/*.ts                 │
│                                                             │
│  4. 병렬 구현 (🔴→🟢)                                       │
│     ├─ BE: 테스트 통과 목표로 구현                          │
│     └─ FE: Mock API로 개발 → 나중에 실제 API 연결          │
│                                                             │
│  5. 통합 검증                                               │
│     └─ Mock 제거 → E2E 테스트                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 테스트 피라미드

| 레벨 | 도구 | 커버리지 목표 | 위치 |
|------|------|-------------|------|
| Unit | pytest / Vitest | ≥ 80% | tests/unit/, src/__tests__/ |
| Integration | pytest / Vitest + MSW | Critical paths | tests/integration/ |
| E2E | Playwright | Key user flows | e2e/ |

### 7.3 테스트 도구

**백엔드:**
| 도구 | 용도 |
|------|------|
| pytest | 테스트 실행 |
| pytest-asyncio | 비동기 테스트 |
| httpx | API 클라이언트 (TestClient 대체) |
| Factory Boy | 테스트 데이터 생성 |
| pytest-cov | 커버리지 측정 |

**프론트엔드:**
| 도구 | 용도 |
|------|------|
| Vitest | 테스트 실행 |
| React Testing Library | 컴포넌트 테스트 |
| MSW (Mock Service Worker) | API 모킹 |
| Playwright | E2E 테스트 |

### 7.4 계약 파일 구조

```
project/
├── contracts/                    # API 계약 (BE/FE 공유)
│   ├── types.ts                 # 공통 타입 정의
│   ├── auth.contract.ts         # 인증 API 계약
│   └── {{feature}}.contract.ts  # 기능별 API 계약
│
├── backend/
│   ├── app/schemas/             # Pydantic 스키마 (계약과 동기화)
│   │   ├── auth.py
│   │   └── {{feature}}.py
│   └── tests/
│       └── api/                 # API 테스트 (계약 기반)
│           ├── test_auth.py
│           └── test_{{feature}}.py
│
└── frontend/
    ├── src/
    │   ├── mocks/
    │   │   ├── handlers/        # MSW Mock 핸들러
    │   │   │   ├── auth.ts
    │   │   │   └── {{feature}}.ts
    │   │   └── data/            # Mock 데이터
    │   └── __tests__/
    │       └── api/             # API 테스트 (계약 기반)
    └── e2e/                     # E2E 테스트
```

### 7.5 TDD 사이클

모든 기능 개발은 다음 사이클을 따릅니다:

```
🔴 RED    → 실패하는 테스트 먼저 작성 (M0.5에서 완료)
🟢 GREEN  → 테스트를 통과하는 최소한의 코드 구현
🔵 REFACTOR → 테스트 통과 유지하며 코드 개선
```

### 7.6 품질 게이트

**병합 전 필수 통과:**
- [ ] 모든 단위 테스트 통과
- [ ] 커버리지 ≥ 80%
- [ ] 린트 통과 (ruff / ESLint)
- [ ] 타입 체크 통과 (mypy / tsc)
- [ ] E2E 테스트 통과 (해당 기능)

**검증 명령어:**
```bash
# 백엔드
pytest --cov=app --cov-report=term-missing
ruff check .
mypy app/

# 프론트엔드
npm run test -- --coverage
npm run lint
npm run type-check

# E2E
npx playwright test
```

---

## 8. API 설계 원칙

### 8.1 RESTful 규칙

| 메서드 | 용도 | 예시 |
|--------|------|------|
| GET | 조회 | GET /users/{id} |
| POST | 생성 | POST /users |
| PUT | 전체 수정 | PUT /users/{id} |
| PATCH | 부분 수정 | PATCH /users/{id} |
| DELETE | 삭제 | DELETE /users/{id} |

### 8.2 응답 형식

**성공 응답:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

**에러 응답:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "이메일 형식이 올바르지 않습니다.",
    "details": [
      { "field": "email", "message": "유효한 이메일을 입력하세요" }
    ]
  }
}
```

### 8.3 API 버저닝

| 방식 | 예시 | 채택 여부 |
|------|------|----------|
| URL 경로 | /api/v1/users | 권장 |
| 헤더 | Accept: application/vnd.api+json; version=1 | 선택 |

---

## 9. 병렬 개발 지원 (Git Worktree)

### 9.1 개요

BE/FE를 완전히 독립된 환경에서 병렬 개발할 때 Git Worktree를 사용합니다.

### 9.2 Worktree 구조

```
~/projects/
├── myapp/                 # 메인 (main 브랜치)
├── myapp-auth-be/         # Worktree: feature/auth-be
├── myapp-auth-fe/         # Worktree: feature/auth-fe
├── myapp-board-be/        # Worktree: feature/board-be
└── myapp-board-fe/        # Worktree: feature/board-fe
```

### 9.3 명령어

```bash
# Worktree 생성
git worktree add ../myapp-auth-be -b feature/auth-be
git worktree add ../myapp-auth-fe -b feature/auth-fe

# 각 Worktree에서 독립 작업
cd ../myapp-auth-be && pytest tests/api/test_auth.py
cd ../myapp-auth-fe && npm run test -- src/__tests__/auth/

# 테스트 통과 후 병합
git checkout main
git merge --no-ff feature/auth-be
git merge --no-ff feature/auth-fe

# Worktree 정리
git worktree remove ../myapp-auth-be
git worktree remove ../myapp-auth-fe
```

### 9.4 병합 규칙

| 조건 | 병합 가능 |
|------|----------|
| 단위 테스트 통과 (🟢) | 필수 |
| 커버리지 ≥ 80% | 필수 |
| 린트/타입 체크 통과 | 필수 |
| E2E 테스트 통과 | 권장 |

---

## Decision Log 참조

{{대화 중 기록된 Decision Log 중 기술 관련 항목}}
