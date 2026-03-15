# Coding Convention & AI Collaboration Guide 템플릿

> 고품질/유지보수/보안을 위한 인간-AI 협업 운영 지침서입니다.

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

## 1. 핵심 원칙

### 1.1 신뢰하되, 검증하라 (Don't Trust, Verify)

AI가 생성한 코드는 반드시 검증해야 합니다:

- [ ] 코드 리뷰: 생성된 코드 직접 확인
- [ ] 테스트 실행: 자동화 테스트 통과 확인
- [ ] 보안 검토: 민감 정보 노출 여부 확인
- [ ] 동작 확인: 실제로 실행하여 기대 동작 확인

### 1.2 최종 책임은 인간에게

- AI는 도구이고, 최종 결정과 책임은 개발자에게 있습니다
- 이해하지 못하는 코드는 사용하지 않습니다
- 의심스러운 부분은 반드시 질문합니다

---

## 2. 프로젝트 구조

### 2.1 디렉토리 구조

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── utils/          # 유틸리티 함수
│   │   ├── services/       # API 호출
│   │   ├── stores/         # 상태 관리
│   │   └── types/          # TypeScript 타입
│   └── tests/
├── backend/
│   ├── app/
│   │   ├── models/         # DB 모델
│   │   ├── routes/         # API 라우트
│   │   ├── schemas/        # 요청/응답 스키마
│   │   ├── services/       # 비즈니스 로직
│   │   └── utils/          # 유틸리티
│   └── tests/
├── docs/
│   └── planning/           # 기획 문서 (소크라테스 산출물)
└── docker-compose.yml
```

### 2.2 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일 (컴포넌트) | PascalCase | `UserProfile.tsx` |
| 파일 (유틸) | camelCase | `formatDate.ts` |
| 파일 (Python) | snake_case | `user_service.py` |
| 컴포넌트 | PascalCase | `UserProfile` |
| 함수/변수 | camelCase | `getUserById` |
| 상수 | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| CSS 클래스 | kebab-case | `user-profile` |

---

## 3. 아키텍처 원칙

### 3.1 뼈대 먼저 (Skeleton First)

1. 전체 구조를 먼저 잡고
2. 빈 함수/컴포넌트로 스켈레톤 생성
3. 하나씩 구현 채워나가기

### 3.2 작은 모듈로 분해

- 한 파일에 200줄 이하 권장
- 한 함수에 50줄 이하 권장
- 한 컴포넌트에 100줄 이하 권장

### 3.3 관심사 분리

| 레이어 | 역할 | 예시 |
|--------|------|------|
| UI | 화면 표시 | React 컴포넌트 |
| 상태 | 데이터 관리 | Zustand 스토어 |
| 서비스 | API 통신 | Axios 래퍼 |
| 유틸 | 순수 함수 | 날짜 포맷, 검증 |

---

## 4. AI 소통 원칙

### 4.1 하나의 채팅 = 하나의 작업

- 한 번에 하나의 명확한 작업만 요청
- 작업 완료 후 다음 작업 진행
- 컨텍스트가 길어지면 새 대화 시작

### 4.2 컨텍스트 명시

**좋은 예:**
> "TASKS 문서의 T2.1을 구현해주세요.
> Database Design의 MAIN_ENTITY를 참조하고,
> TRD의 기술 스택을 따라주세요."

**나쁜 예:**
> "API 만들어줘"

### 4.3 기존 코드 재사용

- 새로 만들기 전에 기존 코드 확인 요청
- 중복 코드 방지
- 일관성 유지

### 4.4 프롬프트 템플릿

```
## 작업
{{무엇을 해야 하는지}}

## 참조 문서
- {{문서명}} 섹션 {{번호}}

## 제약 조건
- {{지켜야 할 것}}

## 예상 결과
- {{생성될 파일}}
- {{기대 동작}}
```

---

## 5. 보안 체크리스트

### 5.1 절대 금지

- [ ] 비밀정보 하드코딩 금지 (API 키, 비밀번호, 토큰)
- [ ] .env 파일 커밋 금지
- [ ] SQL 직접 문자열 조합 금지 (SQL Injection)
- [ ] 사용자 입력 그대로 출력 금지 (XSS)

### 5.2 필수 적용

- [ ] 모든 사용자 입력 검증 (서버 측)
- [ ] 비밀번호 해싱 (bcrypt)
- [ ] HTTPS 사용
- [ ] CORS 설정
- [ ] 인증된 요청만 민감 API 접근

### 5.3 환경 변수 관리

```bash
# .env.example (커밋 O)
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-secret-key-here

# .env (커밋 X)
DATABASE_URL=postgresql://real:real@prod:5432/db
JWT_SECRET=abc123xyz789
```

---

## 6. 테스트 워크플로우

### 6.1 즉시 실행 검증

코드 작성 후 바로 테스트:

```bash
# 백엔드
pytest backend/tests/ -v

# 프론트엔드
npm run test

# E2E
npx playwright test
```

### 6.2 오류 로그 공유 규칙

오류 발생 시 AI에게 전달할 정보:

1. 전체 에러 메시지
2. 관련 코드 스니펫
3. 재현 단계
4. 이미 시도한 해결책

**예시:**
```
## 에러
TypeError: Cannot read property 'id' of undefined

## 코드
const userId = user.id;  // line 42

## 재현
1. 로그인하지 않은 상태에서
2. /profile 페이지 접근

## 시도한 것
- user가 undefined인지 확인 → 맞음
```

---

## 7. Git 워크플로우

### 7.1 브랜치 전략

```
main          # 프로덕션
├── develop   # 개발 통합
│   ├── feature/feat-1-{{기능명}}
│   ├── feature/feat-0-auth
│   └── fix/{{버그설명}}
```

### 7.2 커밋 메시지

```
<type>(<scope>): <subject>

<body>
```

**타입:**
- `feat`: 새 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `docs`: 문서
- `test`: 테스트
- `chore`: 기타

**예시:**
```
feat(auth): 소셜 로그인 추가

- Google OAuth 연동
- Apple 로그인 연동
- TRD 섹션 4.1 구현 완료
```

---

## 8. 코드 품질 도구

### 8.1 필수 설정

| 도구 | 프론트엔드 | 백엔드 |
|------|-----------|--------|
| 린터 | ESLint | Ruff / Flake8 |
| 포매터 | Prettier | Black |
| 타입 체크 | TypeScript | mypy (선택) |

### 8.2 Pre-commit 훅

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: lint
        name: Lint
        entry: npm run lint
        language: system
      - id: format
        name: Format
        entry: npm run format:check
        language: system
```

---

## Decision Log 참조

{{대화 중 기록된 Decision Log}}
