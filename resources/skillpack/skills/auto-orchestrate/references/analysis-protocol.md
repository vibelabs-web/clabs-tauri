# Analysis Protocol (Ultra-Thin Mode)

> 분석/설계 에이전트 간 경량 통신 프로토콜

## 개요

Ultra-Thin 모드에서 오케스트레이터의 컨텍스트를 최소화하기 위해, 분석/설계 에이전트들은 **한 줄 응답**만 반환합니다. 상세 정보는 `.claude/analysis/` 디렉토리의 JSON 파일에 저장됩니다.

---

## 프로토콜 명세

### 1. Architecture Analyst

**입력:**
```
ANALYZE_CODEBASE
ANALYZE_MODULE:backend
ANALYZE_DEPS
```

**출력:**
```
ARCH_MAP:{tech-stack}|{structure}|{pattern}|{domains}
```

**예시:**
```
# 입력
ANALYZE_CODEBASE

# 출력
ARCH_MAP:fastapi+react|monorepo|3-tier|auth,product,order
```

**저장 위치:** `.claude/analysis/architecture.json`

---

### 2. Requirements Analyst

**입력:**
```
REQ_ANALYZE:{사용자 요청 텍스트}
REQ_ANALYZE:FILE:{파일경로}
REQ_VALIDATE:{파일경로}
```

**출력:**
```
REQ_DONE:FR:{기능수}|NFR:{비기능수}|RISK:{위험수}|PRIORITY:{우선순위}
```

**예시:**
```
# 입력
REQ_ANALYZE:사용자 로그인 기능을 구현해주세요. 소셜 로그인도 지원해야 합니다.

# 출력
REQ_DONE:FR:5|NFR:3|RISK:2|PRIORITY:auth>profile>social
```

**저장 위치:** `.claude/analysis/requirements.json`

---

### 3. System Designer

**입력:**
```
DESIGN_SYSTEM
DESIGN_SYSTEM:{domain}
DESIGN_COMPONENT:{component}
```

**컨텍스트 주입 (선택):**
```
DESIGN_SYSTEM:auth
ARCH_MAP:fastapi+react|monorepo|3-tier|auth
REQ_DONE:FR:5|NFR:3|RISK:2|PRIORITY:auth
```

**출력:**
```
DESIGN_DONE:{domain}:{services}svc,{apis}api,{tables}db|pattern:{패턴}|risk:{위험}
```

**예시:**
```
# 입력
DESIGN_SYSTEM:auth

# 출력
DESIGN_DONE:auth:3svc,5api,2db|pattern:repository,strategy|risk:oauth-complexity
```

**저장 위치:** `.claude/analysis/system-design.json`

---

### 4. API Designer

**입력:**
```
DESIGN_API:{domain}
DESIGN_API:{method} {path}
```

**컨텍스트 주입 (선택):**
```
DESIGN_API:auth
DESIGN_DONE:auth:3svc,5api,2db|pattern:repository
```

**출력:**
```
API_DONE:{domain}:{count}endpoints|{methods}|schemas:{count}|errors:{count}
```

**예시:**
```
# 입력
DESIGN_API:auth

# 출력
API_DONE:auth:5endpoints|POST:3,GET:1,DELETE:0|schemas:4|errors:3
```

**저장 위치:** `.claude/analysis/api-design.json`

**생성 파일:**
- `contracts/{domain}.contract.ts`
- `backend/app/schemas/{domain}.py`

---

### 5. Task Planner

**입력:**
```
PLAN_TASKS
PLAN_TASKS:{domain}
```

**컨텍스트 주입 (필수):**
```
PLAN_TASKS
DESIGN_DONE:auth:3svc,5api,2db|pattern:repository
API_DONE:auth:5endpoints|POST:3,GET:1,DELETE:0|schemas:4|errors:3
```

**출력:**
```
PLAN_DONE:P{N}:{count},...|total:{전체}|parallel:{병렬가능}|critical:{크리티컬패스}
```

**예시:**
```
# 입력
PLAN_TASKS

# 출력
PLAN_DONE:P0:3,P1:5,P2:4|total:12|parallel:8|critical:T1.1>T1.3>T2.1
```

**저장 위치:** `.claude/orchestrate-state.json`

**생성 파일:**
- `docs/planning/TASKS.md`

---

### 6. Impact Analyzer

**입력:**
```
ANALYZE_IMPACT:{파일경로}
ANALYZE_IMPACT:{파일1},{파일2},...
ANALYZE_IMPACT:MODULE:{디렉토리}
ANALYZE_IMPACT:COMMIT:{커밋해시}
```

**출력:**
```
IMPACT:files:{영향파일수}|tests:{테스트수}|risk:{위험도}|suggest:{테스트목록}
```

**예시:**
```
# 입력
ANALYZE_IMPACT:backend/app/services/auth_service.py

# 출력
IMPACT:files:12|tests:5|risk:medium|suggest:test_auth.py,test_user.py
```

**저장 위치:** `.claude/analysis/impact.json`

---

## 에러 응답

모든 에이전트는 다음 형식으로 에러를 반환:

```
ERROR:{에러 메시지}
ERROR:CLARIFY:{질문1},{질문2},...
```

**예시:**
```
ERROR:Missing architecture info - run architecture-analyst first
ERROR:CLARIFY:scope(all-users|admin-only),auth(jwt|session)
```

---

## 파이프라인 의존성

```
                    ┌─────────────────────┐
                    │ architecture-analyst │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ requirements-analyst │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐   ┌────────▼────────┐           │
│  system-designer │   │   api-designer  │           │
└────────┬────────┘   └────────┬────────┘           │
         │                     │                     │
         └──────────┬──────────┘                     │
                    │                                │
         ┌──────────▼──────────┐                     │
         │    task-planner     │                     │
         └──────────┬──────────┘                     │
                    │                                │
                    ▼                                │
              [구현 단계]                            │
                    │                                │
         ┌──────────▼──────────┐                     │
         │   impact-analyzer   │◀────────────────────┘
         └─────────────────────┘
              (코드 변경 시)
```

---

## 약어 사전

### Tech Stack (ARCH_MAP)

| 약어 | 의미 |
|------|------|
| `fastapi` | FastAPI (Python) |
| `react` | React (TypeScript) |
| `next` | Next.js |
| `vue` | Vue.js |
| `express` | Express.js |
| `django` | Django |

### Structure (ARCH_MAP)

| 약어 | 의미 |
|------|------|
| `monorepo` | 모노레포 |
| `polyrepo` | 분리된 레포지토리 |
| `single` | 단일 앱 |

### Pattern (ARCH_MAP, DESIGN_DONE)

| 약어 | 의미 |
|------|------|
| `3-tier` | 3계층 아키텍처 |
| `clean` | 클린 아키텍처 |
| `ddd` | 도메인 주도 설계 |
| `mvc` | MVC 패턴 |
| `repository` | Repository 패턴 |
| `strategy` | Strategy 패턴 |

### Domain (모든 프로토콜)

| 약어 | 의미 |
|------|------|
| `auth` | 인증/인가 |
| `user` | 사용자 관리 |
| `product` | 상품 관리 |
| `order` | 주문 관리 |
| `payment` | 결제 |
| `notif` | 알림 |

### Risk Level (IMPACT)

| 값 | 의미 |
|-----|------|
| `low` | 영향 범위 작음 (1-3 파일) |
| `medium` | 중간 영향 (4-10 파일) |
| `high` | 광범위 영향 (10+ 파일) |
| `critical` | 핵심 모듈 변경 |

---

## 컨텍스트 절약 효과

| 에이전트 | 일반 응답 | Ultra-Thin |
|----------|----------|------------|
| architecture-analyst | ~5,000자 | ~50자 |
| requirements-analyst | ~8,000자 | ~60자 |
| system-designer | ~15,000자 | ~80자 |
| api-designer | ~10,000자 | ~60자 |
| task-planner | ~8,000자 | ~70자 |
| impact-analyzer | ~3,000자 | ~60자 |
| **총합** | **~49,000자** | **~380자** |
| **절감률** | - | **99.2%** |

---

## 사용 가이드

### 새 기능 개발 시

```bash
# 1. 아키텍처 파악
ANALYZE_CODEBASE → ARCH_MAP:...

# 2. 요구사항 분석
REQ_ANALYZE:{요청} → REQ_DONE:...

# 3. 설계 (병렬)
DESIGN_SYSTEM:{domain} → DESIGN_DONE:...
DESIGN_API:{domain} → API_DONE:...

# 4. 태스크 분해
PLAN_TASKS → PLAN_DONE:... + TASKS.md

# 5. 구현 시작
```

### 리팩토링/수정 시

```bash
# 1. 영향 분석
ANALYZE_IMPACT:{파일} → IMPACT:...

# 2. 영향 범위 확인
Read(".claude/analysis/impact.json")

# 3. 관련 테스트 실행
pytest {suggest 테스트 목록}
```

### 상세 정보 필요 시

```bash
# JSON 파일에서 상세 정보 확인
Read(".claude/analysis/architecture.json")
Read(".claude/analysis/requirements.json")
Read(".claude/analysis/system-design.json")
Read(".claude/analysis/api-design.json")
Read(".claude/analysis/impact.json")
```
