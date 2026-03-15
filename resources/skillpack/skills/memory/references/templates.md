# Memory Templates

> 새 프로젝트 시작 시 생성되는 메모리 템플릿

---

## user-profile.md (사용자 프로필)

> 소크라테스 스킬에서 사용하는 사용자 개인화 정보

```markdown
# User Profile

## 기본 정보

| 항목 | 값 |
|------|-----|
| 사용자명 | |
| 첫 만남 | YYYY-MM-DD |
| 마지막 세션 | YYYY-MM-DD |

## 레벨 정보

| 항목 | 점수 | 선택 |
|------|------|------|
| IT 경험 | | |
| 기획 경험 | | |
| 동기 명확성 | | |
| **총점** | | |
| **레벨** | L | |

### 레벨 설명

| 레벨 | 설명 |
|------|------|
| L1 | 초심자 - 기술/기획 모두 처음, 자기 인식 낮음 |
| L2 | 일반인 - 약간의 경험, 아이디어는 있음 |
| L3 | 경험자 - 기획 또는 개발 경험 있음, 목표 명확 |
| L4 | 전문가 - 기획+개발 모두 경험, 자기 인식 높음 |

## 대화 선호

- 질문 스타일: 기본
- 기술 용어: {사용 가능/비유 선호/완전 배제}
- 세부 수준: 적당히

## 히스토리

| 날짜 | 프로젝트 | 상태 |
|------|----------|------|
| | | |

## 메모

-
```

### 자동 생성 시점

- 소크라테스 스킬 레벨 측정 완료 시
- `/memory init` 실행 시

### 업데이트 시점

| 이벤트 | 업데이트 필드 |
|--------|--------------|
| 세션 시작 | 마지막 세션 |
| 프로젝트 완료 | 히스토리 추가 |
| 레벨 재측정 | 레벨 정보 전체 |
| 사용자 피드백 | 대화 선호 |

---

## project.md

```markdown
# Project Memory

## 기본 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | |
| 설명 | |
| 시작일 | |
| 저장소 | |

## 기술 스택

### Backend
- 프레임워크:
- 언어:
- 런타임:

### Frontend
- 프레임워크:
- 언어:
- 빌드 도구:

### Database
- 주 DB:
- 캐시:
- 검색:

### Infrastructure
- 호스팅:
- CI/CD:
- 모니터링:

## 아키텍처

[아키텍처 다이어그램 또는 설명]

## 주요 디렉토리

```
project/
├── backend/
│   └──
├── frontend/
│   └──
└── shared/
    └──
```

## 외부 서비스

| 서비스 | 용도 | 문서 |
|--------|------|------|
| | | |

## 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| | | |

## 특이사항

-

## 연락처

| 역할 | 담당자 |
|------|--------|
| | |
```

---

## preferences.md

```markdown
# User Preferences

## 코드 스타일

### 공통
- 들여쓰기:
- 최대 줄 길이:
- 줄바꿈:

### TypeScript/JavaScript
- 따옴표:
- 세미콜론:
- 트레일링 콤마:

### Python
- 따옴표:
- 타입 힌트:

## 명명 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수 | | |
| 함수 | | |
| 클래스 | | |
| 상수 | | |
| 파일 | | |
| 디렉토리 | | |

## 선호 라이브러리

| 용도 | 선호 | 비선호 | 이유 |
|------|------|--------|------|
| 상태 관리 | | | |
| 스타일링 | | | |
| 폼 처리 | | | |
| 날짜 | | | |
| HTTP 클라이언트 | | | |

## 선호 패턴

- [ ] Early return
- [ ] 구조분해 할당
- [ ] 옵셔널 체이닝
- [ ] Nullish coalescing
- [ ]

## 비선호 패턴

- [ ] any 타입
- [ ] 매직 넘버
- [ ] 중첩 콜백
- [ ]
```

---

## patterns.md

```markdown
# Code Patterns

## API 패턴

### 요청/응답 형식

```json
// 성공 응답
{
  "success": true,
  "data": {},
  "message": null
}

// 에러 응답
{
  "success": false,
  "data": null,
  "message": "",
  "code": ""
}
```

### 페이지네이션

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "perPage": 20,
  "totalPages": 0
}
```

## 컴포넌트 패턴

### 구조

```typescript
// 순서
1. imports
2. types
3. constants
4. component
   - hooks
   - derived state
   - handlers
   - effects
   - render
5. exports
```

### Props 정의

```typescript
interface ComponentProps {
  // required props

  // optional props

  // callbacks
}
```

## 에러 처리 패턴

### Backend

```python
try:
    # business logic
except ValidationError as e:
    # 422
except NotFoundError as e:
    # 404
except Exception as e:
    # 500
```

### Frontend

```typescript
try {
  // API call
} catch (error) {
  if (error instanceof ApiError) {
    // handle known error
  }
  // handle unknown error
}
```

## 테스트 패턴

### 파일 구조

```
tests/
├── unit/
├── integration/
└── e2e/
```

### 네이밍

```
describe("[기능]")
  it("should [동작] when [조건]")
```
```

---

## decisions.md

```markdown
# Architecture Decisions

## ADR 템플릿

---

## ADR-XXX: [제목]

**날짜**: YYYY-MM-DD
**상태**: 제안됨 | 승인됨 | 폐기됨 | 대체됨

### 컨텍스트

[결정이 필요한 상황 설명]

### 결정

[내린 결정]

### 대안 검토

| 대안 | 장점 | 단점 |
|------|------|------|
| | | |

### 결과

- 장점:
- 단점:
- 리스크:

### 관련 문서

-

---
```

---

## learnings.md

```markdown
# Learnings

## 학습 기록 템플릿

---

## YYYY-MM-DD: [제목]

### 문제

[발생한 문제]

### 증상

```
[에러 메시지 또는 증상]
```

### 원인

[근본 원인]

### 해결

```
[해결 코드 또는 방법]
```

### 교훈

-

### 관련 링크

-

---
```

---

## 폴더 구조

```
.claude/
└── memory/
    ├── project.md        # 프로젝트 기본 정보
    ├── preferences.md    # 사용자 선호
    ├── patterns.md       # 코드 패턴
    ├── decisions.md      # 아키텍처 결정
    └── learnings.md      # 학습 기록
```

---

## 생성 명령

```bash
# Memory 폴더 생성
mkdir -p .claude/memory

# 템플릿 파일 생성
touch .claude/memory/{project,preferences,patterns,decisions,learnings}.md
```

---

## .gitignore 설정

```gitignore
# 팀 공유 메모리는 커밋
# .claude/memory/

# 개인 메모리는 제외
.claude/memory.local/
```
