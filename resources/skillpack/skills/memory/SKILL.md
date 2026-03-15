---
name: memory
description: 세션 간 학습 지속 및 프로젝트 지식 축적. .claude/memory/에 구조화된 메모리 저장.
trigger: 프로젝트 시작 시 자동 로드, 중요 결정/학습 시 자동 저장
---

# Memory Skill

> 세션 간 학습 지속 및 프로젝트 지식 축적

## 개요

Memory 패턴을 적용하여 세션 간 학습을 지속하고, 프로젝트별 지식을 축적합니다.

**문제**: 매 세션마다 같은 설명 반복, 이전 결정 망각
**해결**: 구조화된 메모리 시스템으로 지식 영속화

---

## 메모리 구조

```
.claude/
├── memory/
│   ├── user-profile.md     # 사용자 프로필 (레벨, 선호) ← 신규!
│   ├── project.md          # 프로젝트 지식
│   ├── preferences.md      # 사용자 선호 (코딩 스타일)
│   ├── patterns.md         # 코드 패턴
│   ├── decisions.md        # 아키텍처 결정
│   └── learnings.md        # 실수 및 학습
```

---

## 메모리 종류

### 0. 사용자 프로필 (user-profile.md) ← 신규!

사용자의 레벨 및 개인화 정보:

```markdown
# User Profile

## 기본 정보
| 항목 | 값 |
|------|-----|
| 사용자명 | 철수 |
| 첫 만남 | 2026-01-15 |
| 마지막 세션 | 2026-01-27 |

## 레벨 정보
| 항목 | 점수 | 선택 |
|------|------|------|
| IT 경험 | 2 | 조금 경험 |
| 기획 경험 | 1 | 처음이에요 |
| 동기 명확성 | 3 | 꽤 명확해요 |
| **총점** | 6 | |
| **레벨** | L2 | 일반인 - 약간의 경험, 아이디어는 있음 |

## 대화 선호
- 질문 스타일: 부드러운
- 기술 용어: 비유 선호
- 세부 수준: 적당히

## 히스토리
| 날짜 | 프로젝트 | 상태 |
|------|----------|------|
| 2026-01-15 | 가계부 앱 | 완료 |
| 2026-01-20 | 일정 관리 앱 | 진행중 |
```

**용도:**
- 소크라테스 스킬에서 레벨 측정 스킵 여부 결정
- 사용자에 맞는 질문 스타일 자동 적용
- 이전 프로젝트 히스토리 추적

---

### 1. 프로젝트 메모리 (project.md)

프로젝트 전반적인 컨텍스트:

```markdown
# Project Memory

## 기본 정보
- 프로젝트명: E-Commerce Platform
- 기술 스택: FastAPI + React + PostgreSQL
- 시작일: 2026-01-10

## 아키텍처
- 백엔드: Monolithic (추후 마이크로서비스 전환 예정)
- 프론트엔드: Next.js App Router
- 데이터베이스: PostgreSQL + Redis (캐싱)

## 주요 디렉토리
- `/backend/app/api/` - API 엔드포인트
- `/frontend/src/app/` - Next.js 페이지
- `/shared/contracts/` - 공유 타입 정의

## 외부 서비스
- 결제: Stripe
- 이메일: SendGrid
- 파일 저장: S3

## 특이사항
- 모든 API는 `/api/v1/` 접두사 사용
- 인증은 JWT + 리프레시 토큰 방식
- 다국어 지원 (ko, en, ja)
```

### 2. 사용자 선호 (preferences.md)

개인화된 코딩 스타일:

```markdown
# User Preferences

## 코드 스타일
- 들여쓰기: 2 spaces (TypeScript), 4 spaces (Python)
- 따옴표: 작은따옴표 선호
- 세미콜론: 사용하지 않음 (TypeScript)
- 줄바꿈: 함수 사이 2줄

## 명명 규칙
- 변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 컴포넌트: PascalCase
- 파일: kebab-case.ts

## 선호 라이브러리
- 상태 관리: Zustand (Redux 싫어함)
- 스타일링: Tailwind (CSS-in-JS 싫어함)
- 폼: React Hook Form
- 날짜: dayjs (moment 싫어함)

## 싫어하는 패턴
- any 타입 사용
- 콜백 지옥
- 매직 넘버
- 축약된 변수명 (e, d, x 등)

## 선호하는 패턴
- 명시적인 타입 정의
- Early return
- 구조분해 할당
- 옵셔널 체이닝
```

### 3. 코드 패턴 (patterns.md)

프로젝트에서 사용하는 패턴:

```markdown
# Code Patterns

## API 응답 패턴

```python
# 성공 응답
{
    "success": true,
    "data": {...},
    "message": null
}

# 에러 응답
{
    "success": false,
    "data": null,
    "message": "Error description",
    "code": "ERROR_CODE"
}
```

## 컴포넌트 구조

```typescript
// 항상 이 순서로 작성
interface Props {}
export function Component({ }: Props) {
  // 1. hooks
  // 2. derived state
  // 3. handlers
  // 4. effects
  // 5. render
}
```

## 에러 처리 패턴

```python
try:
    result = await service.process()
except ValidationError as e:
    raise HTTPException(422, detail=str(e))
except NotFoundError as e:
    raise HTTPException(404, detail=str(e))
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(500, detail="Internal server error")
```
```

### 4. 아키텍처 결정 (decisions.md)

중요 결정 기록 (ADR 스타일):

```markdown
# Architecture Decisions

## ADR-001: Monolithic 시작

**날짜**: 2026-01-10
**상태**: 승인됨

**컨텍스트**:
- 초기 스타트업, 빠른 개발 필요
- 팀 규모 작음 (3명)

**결정**:
Monolithic 아키텍처로 시작, 트래픽 증가 시 마이크로서비스 전환

**결과**:
- 빠른 개발 가능
- 배포 단순
- 추후 분리 비용 발생 예상

---

## ADR-002: PostgreSQL 선택

**날짜**: 2026-01-10
**상태**: 승인됨

**컨텍스트**:
- 복잡한 쿼리 필요 (상품 검색, 통계)
- JSON 데이터 저장 필요

**결정**:
PostgreSQL + JSONB 사용

**대안 검토**:
- MongoDB: NoSQL이라 조인 복잡
- MySQL: JSON 지원 미흡
```

### 5. 학습 기록 (learnings.md)

실수와 해결책:

```markdown
# Learnings

## 2026-01-15: N+1 쿼리 문제

**문제**:
상품 목록 조회 시 카테고리 정보를 N+1 쿼리로 가져옴

**원인**:
```python
# 잘못된 코드
products = await Product.all()
for p in products:
    category = await p.category  # N번 추가 쿼리!
```

**해결**:
```python
# 수정된 코드
products = await Product.all().prefetch_related('category')
```

**교훈**:
- 항상 관계 데이터는 prefetch/join 사용
- 쿼리 로깅 활성화 필수

---

## 2026-01-16: React hydration 불일치

**문제**:
서버/클라이언트 렌더링 불일치로 hydration 에러

**원인**:
```tsx
// 잘못된 코드
<div>{new Date().toLocaleDateString()}</div>
```

**해결**:
```tsx
// 수정된 코드
const [date, setDate] = useState<string>()
useEffect(() => {
  setDate(new Date().toLocaleDateString())
}, [])
```

**교훈**:
- 시간/날짜는 클라이언트에서만 렌더링
- suppressHydrationWarning 남용 금지
```

---

## 메모리 연산

### 저장 (Remember)

새로운 정보 메모리에 저장:

```markdown
사용자: "앞으로 React 컴포넌트는 항상 arrow function으로 작성해줘"

→ preferences.md에 추가:
## 컴포넌트 스타일
- 함수형 컴포넌트: Arrow Function 사용
  - ✅ `const Component = () => {}`
  - ❌ `function Component() {}`
```

### 회상 (Recall)

관련 메모리 검색:

```markdown
사용자: "상품 API 엔드포인트 만들어줘"

→ 메모리 검색:
1. project.md → API 접두사: /api/v1/
2. patterns.md → 응답 형식, 에러 처리
3. preferences.md → 코드 스타일
4. decisions.md → REST vs GraphQL 결정

→ 컨텍스트 로드 후 코드 생성
```

### 업데이트 (Update)

기존 메모리 수정:

```markdown
사용자: "이제 Zustand 대신 Jotai 쓰자"

→ preferences.md 수정:
- 상태 관리: Zustand → Jotai
- 이유: 더 세밀한 구독 필요
- 변경일: 2026-01-17
```

### 망각 (Forget)

불필요한 메모리 삭제:

```markdown
사용자: "이전에 말한 ESLint 규칙 무시해"

→ preferences.md에서 해당 규칙 제거
```

---

## 자동 메모리 수집

다음 상황에서 자동으로 메모리 수집:

| 이벤트 | 저장 대상 | 저장 위치 |
|--------|----------|----------|
| 새 프로젝트 시작 | 기술 스택, 구조 | project.md |
| 사용자 피드백 | "이렇게 해줘/하지마" | preferences.md |
| 코드 리뷰 | 반복되는 패턴 | patterns.md |
| 아키텍처 논의 | 주요 결정 | decisions.md |
| 버그 수정 | 원인과 해결책 | learnings.md |

---

## 메모리 활용 시점

### 코드 생성 전

```markdown
1. project.md 로드 → 프로젝트 컨텍스트 확보
2. patterns.md 로드 → 기존 패턴 준수
3. preferences.md 로드 → 사용자 스타일 적용
```

### 문제 해결 시

```markdown
1. learnings.md 검색 → 유사 문제 해결 경험 확인
2. decisions.md 검색 → 관련 아키텍처 결정 확인
```

### 새로운 기능 추가 시

```markdown
1. project.md 확인 → 기존 구조와 일관성 유지
2. decisions.md 확인 → 기존 결정과 충돌 여부
```

---

## 명령어

### 메모리 조회

```
/memory show              # 전체 메모리 요약
/memory show project      # 프로젝트 메모리
/memory show preferences  # 사용자 선호
/memory show patterns     # 코드 패턴
/memory show decisions    # 아키텍처 결정
/memory show learnings    # 학습 기록
```

### 메모리 추가

```
/memory add "Tailwind 클래스는 알파벳 순으로 정렬"
/memory add decision "Redis 캐시 도입 - 읽기 성능 개선 목적"
/memory add learning "CORS 이슈 - 백엔드에서 origin 명시 필요"
```

### 메모리 검색

```
/memory search "인증"
/memory search "에러 처리"
```

### 메모리 초기화

```
/memory init              # 새 프로젝트 메모리 생성
/memory clear learnings   # 특정 메모리 초기화
```

---

## 메모리 동기화

### 팀 공유 메모리

`.claude/memory/` 폴더를 Git에 커밋하면 팀원과 메모리 공유:

```bash
git add .claude/memory/
git commit -m "Update project memory"
```

### 개인 메모리

`.claude/memory.local/`은 `.gitignore`에 추가하여 개인 설정 유지:

```gitignore
.claude/memory.local/
```

---

## 메모리 파일 템플릿

새 프로젝트 시작 시 자동 생성되는 템플릿:

```markdown
# Project Memory

## 기본 정보
- 프로젝트명: [프로젝트명]
- 기술 스택: [스택]
- 시작일: [날짜]

## 아키텍처
[아키텍처 설명]

## 주요 디렉토리
[디렉토리 구조]

## 외부 서비스
[연동 서비스]

## 특이사항
[프로젝트 특이사항]
```

---

## 다른 스킬과 연동

### Socrates → Memory

**레벨 측정 시 사용자 프로필 생성:**

```
/socrates 시작
    ↓
user-profile.md 확인
    ↓
┌─────────────────────────────┐
│ 프로필 존재?                 │
└─────────────────────────────┘
    ↓ Yes              ↓ No
레벨 측정             레벨 측정
건너뛰기              진행 (3개 질문)
    ↓                    ↓
바로 기획             user-profile.md 생성
시작                  - 레벨 정보 저장
                      - 첫 만남 날짜
```

**기획 완료 시 프로젝트 메모리 생성:**

```
/socrates 완료
    ↓
1. user-profile.md 업데이트
   - 마지막 세션 날짜
   - 히스토리에 프로젝트 추가

2. project.md 자동 생성
   - 프로젝트명, 기술 스택
   - 주요 기능, 외부 서비스
```

### Reflection → Memory

리플렉션 결과 학습 기록:

```
/reflection 완료
    ↓
learnings.md 자동 추가
- 발견된 이슈와 수정 내용
```

### Project Bootstrap → Memory

프로젝트 셋업 시 메모리 초기화:

```
/project-bootstrap 완료
    ↓
.claude/memory/ 폴더 생성
모든 메모리 파일 템플릿 생성
```

---

## 주의사항

1. **민감 정보 제외**: 비밀번호, API 키는 메모리에 저장하지 않음
2. **정기 정리**: 오래된/불필요한 메모리 정기적 정리 권장
3. **팀 동기화**: 팀 공유 메모리는 PR로 리뷰 후 병합
4. **버전 관리**: 중요 결정은 날짜와 함께 기록

---

## 참고

- 메모리 위치: `.claude/memory/`
- 개인 메모리: `.claude/memory.local/` (Git 제외)
- 자동 수집: 대화 중 자동으로 중요 정보 수집
