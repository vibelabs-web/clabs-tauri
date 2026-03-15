---
name: reverse
description: 기존 코드베이스에서 명세(spec)를 역추출. 레거시 프로젝트를 Claude Labs 워크플로우에 통합.
trigger: /reverse, 기존 프로젝트 분석 시
integrates_with: [screen-spec, tasks-generator, socrates]
inspired_by: SDD Tool (https://github.com/JakeB-5/sdd-tool)
---

# Reverse - 코드에서 명세 역추출

> **"기존 코드를 이해하고, 명세로 문서화하여, 미래의 개발을 가이드한다"**

## 개요

Reverse는 SDD Tool의 역추출 기능을 Claude Labs에 통합한 스킬입니다.
기존 프로젝트를 분석하여 화면 명세(screen-spec), 도메인 리소스, API 계약을 자동 추출합니다.

---

## 워크플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Reverse Engineering Flow                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  기존 코드베이스                                                     │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────┐                                               │
│  │   /reverse scan  │    프로젝트 구조 스캔                          │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐                                               │
│  │ /reverse extract │    명세 초안 추출                              │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ├── specs/domain/resources.yaml    (도메인 리소스)        │
│           ├── specs/screens/*.yaml           (화면 명세)            │
│           ├── specs/api/*.yaml               (API 계약)             │
│           └── docs/planning/reverse-*.md     (역추출 문서)          │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐                                               │
│  │ /reverse review  │    추출된 명세 리뷰                            │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐                                               │
│  │/reverse finalize │    명세 확정 & 갭 분석                         │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  Claude Labs 워크플로우 통합                                         │
│  ├── /tasks-generator analyze  (남은 작업 파악)                     │
│  ├── /sync                     (명세-코드 동기화)                   │
│  └── /auto-orchestrate         (추가 개발)                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 단계별 실행

### Step 1: /reverse scan

프로젝트 구조를 스캔하고 분석 대상을 파악합니다.

```bash
/reverse scan
```

**수행 작업:**

1. **디렉토리 구조 분석**
   ```
   프로젝트/
   ├── backend/          → FastAPI/Express 감지
   ├── frontend/         → React/Vue/Svelte 감지
   ├── database/         → 마이그레이션 파일 분석
   └── tests/            → 테스트 커버리지 파악
   ```

2. **기술 스택 감지**
   - package.json, requirements.txt, pyproject.toml 분석
   - 프레임워크 버전 확인
   - 의존성 그래프 생성

3. **코드베이스 규모 측정**
   - 파일 수, 라인 수
   - 모듈/컴포넌트 수
   - API 엔드포인트 수

**출력:**

```markdown
# Reverse Scan Report

## 프로젝트 개요
- **이름**: my-legacy-project
- **규모**: 중형 (15,000 LOC)
- **연령**: 2년 (git history 기준)

## 기술 스택
| 레이어 | 기술 | 버전 |
|--------|------|------|
| Backend | FastAPI | 0.109.0 |
| Frontend | React | 18.2.0 |
| Database | PostgreSQL | 15 |
| ORM | SQLAlchemy | 2.0.25 |

## 구조 분석
- API 엔드포인트: 45개
- React 컴포넌트: 78개
- DB 테이블: 12개
- 테스트 커버리지: 62%

## 역추출 대상
- [ ] 도메인 리소스 (12 테이블)
- [ ] API 계약 (45 엔드포인트)
- [ ] 화면 명세 (15 페이지 추정)

## 다음 단계
→ `/reverse extract` 실행
```

---

### Step 2: /reverse extract

코드에서 명세를 자동 추출합니다.

```bash
/reverse extract              # 전체 추출
/reverse extract --domain     # 도메인만
/reverse extract --screens    # 화면만
/reverse extract --api        # API만
```

**추출 대상:**

#### 1. 도메인 리소스 (from DB/ORM)

```python
# 소스 코드 분석
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

```yaml
# 추출된 specs/domain/resources.yaml
resources:
  users:
    description: "사용자 (역추출됨)"
    fields:
      - name: id
        type: integer
        primary: true
      - name: email
        type: string
        unique: true
        required: true
      - name: name
        type: string
        required: true
      - name: created_at
        type: datetime
        default: now()

    _reverse_meta:
      source: "app/models/user.py:5"
      extracted_at: "2025-01-30"
      confidence: 0.95
```

#### 2. API 계약 (from Routes)

```python
# 소스 코드 분석
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

```yaml
# 추출된 specs/api/users.yaml
endpoints:
  get_user:
    method: GET
    path: /users/{user_id}
    description: "사용자 조회 (역추출됨)"

    parameters:
      - name: user_id
        in: path
        type: integer
        required: true

    responses:
      200:
        schema: UserResponse
      404:
        description: "User not found"

    _reverse_meta:
      source: "app/routers/users.py:15"
      extracted_at: "2025-01-30"
```

#### 3. 화면 명세 (from Components)

```tsx
// 소스 코드 분석
export function UserList() {
  const { data: users, isLoading } = useQuery(['users'], fetchUsers);

  return (
    <div className="grid grid-cols-3 gap-4">
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

```yaml
# 추출된 specs/screens/user-list.yaml
version: "2.0"
screen:
  name: 사용자 목록
  route: /users
  description: "사용자 목록 화면 (역추출됨)"

data_requirements:
  - resource: users
    needs: [id, name, email, avatar]
    source: "useQuery(['users'])"

components:
  - id: user_grid
    type: grid
    columns: 3
    gap: 4
    children:
      - type: UserCard
        props: { user: "item" }

_reverse_meta:
  source: "src/pages/UserList.tsx"
  extracted_at: "2025-01-30"
  confidence: 0.85
```

---

### Step 3: /reverse review

추출된 명세를 검토하고 수정합니다.

```bash
/reverse review
```

**리뷰 체크리스트:**

```markdown
## Reverse Review Checklist

### 도메인 리소스
- [ ] 모든 테이블이 추출되었는가?
- [ ] 관계(FK)가 정확한가?
- [ ] 필드 타입이 올바른가?
- [ ] 비즈니스 규칙이 누락되지 않았는가?

### API 계약
- [ ] 모든 엔드포인트가 추출되었는가?
- [ ] 요청/응답 스키마가 정확한가?
- [ ] 인증 요구사항이 반영되었는가?
- [ ] 에러 케이스가 문서화되었는가?

### 화면 명세
- [ ] 모든 페이지가 추출되었는가?
- [ ] 데이터 요구사항이 정확한가?
- [ ] 컴포넌트 구조가 올바른가?
- [ ] 사용자 흐름이 파악되었는가?
```

**수동 보완 포인트:**

```yaml
# 역추출 시 자동 감지 어려운 항목
manual_review_needed:
  - business_rules: "코드 주석이나 테스트에서 추론"
  - validation_rules: "프론트엔드 폼 검증 로직 확인"
  - edge_cases: "에러 핸들링 코드 분석"
  - user_flows: "라우터 구조와 네비게이션 분석"
```

---

### Step 4: /reverse finalize

명세를 확정하고 갭 분석을 수행합니다.

```bash
/reverse finalize
```

**수행 작업:**

1. **명세 확정**
   - `_reverse_meta` 제거
   - 최종 버전으로 저장

2. **갭 분석 (Gap Analysis)**
   ```markdown
   ## Gap Analysis Report

   ### 누락된 명세
   - 에러 처리 표준화 필요
   - API 버저닝 전략 부재
   - 접근성(a11y) 가이드라인 없음

   ### 불일치 발견
   - DB 스키마 vs 코드: 3개 필드 불일치
   - API 문서 vs 구현: 2개 엔드포인트 차이

   ### 기술 부채
   - 테스트 커버리지 62% → 70% 목표
   - 타입 안전성 미흡 (any 타입 23개)
   - 문서화 부족 (공개 API의 45%만 문서화)
   ```

3. **TASKS.md 생성**
   ```bash
   /tasks-generator analyze
   ```
   - 갭을 채우기 위한 태스크 자동 생성

---

## 추출 신뢰도 (Confidence)

각 추출 항목에 신뢰도를 부여:

| 신뢰도 | 의미 | 조치 |
|--------|------|------|
| **0.9+** | 높음 | 자동 확정 가능 |
| **0.7-0.9** | 중간 | 리뷰 권장 |
| **0.5-0.7** | 낮음 | 수동 확인 필수 |
| **<0.5** | 매우 낮음 | 재작성 권장 |

```yaml
# 신뢰도 계산 요소
confidence_factors:
  - type_annotations: 0.3    # 타입 힌트 존재 시
  - test_coverage: 0.2       # 테스트가 동작 증명
  - documentation: 0.2       # docstring/주석 존재
  - consistent_patterns: 0.2 # 일관된 코드 패턴
  - explicit_contracts: 0.1  # OpenAPI, TypeScript 등
```

---

## 출력 구조

```
project/
├── specs/                      # 역추출된 명세
│   ├── domain/
│   │   └── resources.yaml      # 도메인 리소스
│   ├── screens/
│   │   ├── user-list.yaml      # 화면 명세
│   │   └── user-detail.yaml
│   └── api/
│       ├── users.yaml          # API 계약
│       └── products.yaml
│
├── docs/
│   └── planning/
│       ├── reverse-scan.md     # 스캔 리포트
│       ├── reverse-extract.md  # 추출 리포트
│       └── reverse-gaps.md     # 갭 분석
│
└── .claude/
    └── reverse/
        ├── scan-cache.json     # 스캔 캐시
        └── extract-log.json    # 추출 로그
```

---

## 지원 기술 스택

### 백엔드

| 프레임워크 | DB/ORM 추출 | API 추출 | 신뢰도 |
|-----------|:-----------:|:--------:|:------:|
| FastAPI | ✅ SQLAlchemy | ✅ OpenAPI | 높음 |
| Express | ✅ Prisma/Sequelize | ⚠️ JSDoc | 중간 |
| Django | ✅ Django ORM | ✅ DRF | 높음 |
| Rails | ✅ ActiveRecord | ⚠️ Routes | 중간 |

### 프론트엔드

| 프레임워크 | 컴포넌트 추출 | 라우트 추출 | 신뢰도 |
|-----------|:------------:|:----------:|:------:|
| React | ✅ | ✅ React Router | 높음 |
| Next.js | ✅ | ✅ App Router | 높음 |
| Vue | ✅ | ✅ Vue Router | 중간 |
| Svelte | ⚠️ | ✅ SvelteKit | 중간 |

---

## socrates/screen-spec 연동

역추출 후 Claude Labs 표준 워크플로우와 통합:

```markdown
## 레거시 → Claude Labs 통합 흐름

1. /reverse scan → 기존 코드 분석
2. /reverse extract → 명세 역추출
3. /reverse finalize → 명세 확정 + 갭 분석

   === 여기서 Claude Labs 워크플로우 진입 ===

4. /socrates (선택) → 추가 기능 기획
5. /screen-spec → 누락된 화면 명세 작성
6. /tasks-generator → 갭을 채우는 태스크 생성
7. /auto-orchestrate → 추가 개발 실행
```

---

## 사용 예시

### 시나리오 1: 레거시 프로젝트 인수인계

```bash
# 1. 프로젝트 스캔
/reverse scan

# 2. 전체 명세 추출
/reverse extract

# 3. 리뷰 및 보완
/reverse review

# 4. 확정 및 갭 분석
/reverse finalize

# 5. 남은 작업 확인
/tasks-generator analyze
```

### 시나리오 2: 문서화되지 않은 API 분석

```bash
# API만 역추출
/reverse extract --api

# OpenAPI 형식으로 내보내기
/reverse export --format openapi
```

### 시나리오 3: 신규 팀원 온보딩

```bash
# 프로젝트 전체 구조 파악
/reverse scan --verbose

# 핵심 도메인 이해
/reverse extract --domain

# 아키텍처 다이어그램 생성
/reverse diagram
```

---

## 참조 파일

- `references/extraction-rules.md` - 추출 규칙 상세
- `references/tech-stack-support.md` - 지원 기술 스택
- `references/confidence-calculation.md` - 신뢰도 계산 알고리즘
