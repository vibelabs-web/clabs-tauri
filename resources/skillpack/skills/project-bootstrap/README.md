# Project Bootstrap Skill - 종합 가이드

> AI 에이전트 팀을 자동 생성하고, 오케스트레이터가 전문가 에이전트를 조율하여 프로젝트를 개발하는 Claude Code 스킬

## 목차

1. [개요](#개요)
2. [설치](#설치)
3. [핵심 기능](#핵심-기능)
4. [사용법](#사용법)
5. [아키텍처](#아키텍처)
6. [TDD 워크플로우](#tdd-워크플로우)
7. [Git Worktree 전략](#git-worktree-전략)
8. [지원 기술 스택](#지원-기술-스택)
9. [트러블슈팅](#트러블슈팅)

---

## 개요

### 무엇인가?

Project Bootstrap은 Claude Code에서 **멀티 에이전트 개발 팀**을 자동으로 구성하고 관리하는 스킬입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 요청                               │
│              "T1.2 로그인 UI 구현해줘"                        │
└─────────────────┬───────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              /orchestrate (오케스트레이터)                   │
│   - 작업 분석 및 분해                                        │
│   - 적절한 전문가 에이전트 선택                              │
│   - Task 도구로 병렬 실행                                    │
└────────┬──────────────────┬─────────────────────────────────┘
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ backend-        │  │ frontend-       │
│ specialist      │  │ specialist      │
│                 │  │                 │
│ - FastAPI       │  │ - React/Vite    │
│ - 인증 API      │  │ - 로그인 UI     │
│ - TDD 🔴→🟢     │  │ - TDD 🔴→🟢     │
└─────────────────┘  └─────────────────┘
```

### 핵심 가치

| 기능 | 설명 |
|------|------|
| **자동 팀 구성** | 프로젝트 요구사항에 맞는 에이전트 팀 자동 생성 |
| **TDD 강제** | Contract-First TDD로 테스트 먼저, 구현 나중 |
| **병렬 개발** | Git Worktree로 BE/FE 동시 개발 |
| **기획 연동** | /socrates로 생성된 7개 기획 문서 기반 개발 |

---

## 설치

### 전역 설치 (권장)

```bash
# 1. 스킬 디렉토리 복사
cp -r .claude/skills/project-bootstrap ~/.claude/skills/

# 2. 전역 에이전트 설치
cp .claude/skills/project-bootstrap/references/backend-specialist.md ~/.claude/agents/
cp .claude/skills/project-bootstrap/references/frontend-specialist.md ~/.claude/agents/
cp .claude/skills/project-bootstrap/references/database-specialist.md ~/.claude/agents/
cp .claude/skills/project-bootstrap/references/test-specialist.md ~/.claude/agents/

# 3. 오케스트레이터 명령어 설치
cp .claude/skills/project-bootstrap/references/orchestrate-command.md ~/.claude/commands/orchestrate.md
```

### 설치 확인

```bash
ls ~/.claude/agents/
# backend-specialist.md
# frontend-specialist.md
# database-specialist.md
# test-specialist.md

ls ~/.claude/commands/
# orchestrate.md
```

---

## 핵심 기능

### 1. 에이전트 팀 생성

**트리거**: "에이전트 팀 만들어줘", "에이전트 팀 구성해줘"

```
사용자: "FastAPI + React로 에이전트 팀 만들어줘"

→ 자동 생성:
.claude/
├── agents/
│   ├── backend-specialist.md
│   ├── frontend-specialist.md
│   ├── database-specialist.md
│   └── test-specialist.md
└── commands/
    ├── orchestrate.md
    ├── integration-validator.md
    └── agent-lifecycle.md
```

### 2. 오케스트레이터 (`/orchestrate`)

**트리거**: `/orchestrate T1.2 진행해줘`

오케스트레이터는 슬래시 명령어로 실행되며, Task 도구를 사용하여 전문가 에이전트를 호출합니다.

```
/orchestrate T1.2 로그인 UI 구현해줘

→ 오케스트레이터 분석:
  - T1.2는 Frontend 작업
  - Phase 1이므로 Git Worktree 필요
  - 의존성: T1.1 (Backend) 완료됨

→ Task 도구 호출:
  - subagent_type: "frontend-specialist"
  - prompt: "Phase 1, T1.2: 로그인 UI 구현..."
```

### 3. 전문가 에이전트

| 에이전트 | 역할 | 주요 도구 |
|----------|------|----------|
| `backend-specialist` | FastAPI, API 엔드포인트, 비즈니스 로직 | pytest |
| `frontend-specialist` | React/Vite, UI 컴포넌트, 상태관리 | Vitest |
| `database-specialist` | SQLAlchemy, Alembic 마이그레이션 | pytest |
| `test-specialist` | 통합/E2E 테스트, 품질 게이트 | Playwright |

### 4. TDD 워크플로우

모든 전문가 에이전트는 TDD를 강제로 따릅니다.

```
┌──────────────────┬──────────────┬────────────────────────────┐
│ 태스크 패턴       │ TDD 상태     │ 행동                        │
├──────────────────┼──────────────┼────────────────────────────┤
│ T0.5.x (테스트)  │ 🔴 RED       │ 테스트만 작성, 구현 금지     │
├──────────────────┼──────────────┼────────────────────────────┤
│ T*.1, T*.2 (구현)│ 🔴→🟢        │ 기존 테스트 통과시키기       │
├──────────────────┼──────────────┼────────────────────────────┤
│ T*.3 (통합)      │ 🟢 검증      │ E2E 테스트 실행             │
└──────────────────┴──────────────┴────────────────────────────┘
```

### 5. Git Worktree 전략

Phase 번호에 따라 자동으로 Git Worktree를 관리합니다.

| Phase | 행동 | 예시 |
|-------|------|------|
| Phase 0 | main에서 직접 작업 | T0.1, T0.5.2 |
| Phase 1+ | Worktree 자동 생성 | T1.1 → `worktree/phase-1-auth` |

---

## 사용법

### 워크플로우 A: 처음부터 시작

```bash
# 1. 새 프로젝트 폴더 생성
mkdir my-project && cd my-project

# 2. Claude Code 실행
claude

# 3. 에이전트 팀 생성 요청
> "에이전트 팀 만들어줘"

# 4. 기술 스택이 없으면 /socrates 자동 발동
#    21개 질문으로 기획 + 기술 스택 결정

# 5. 에이전트 팀 + 프로젝트 환경 생성

# 6. 개발 시작
> /orchestrate T0.1 프로젝트 구조 초기화해줘
```

### 워크플로우 B: 기존 프로젝트에 적용

```bash
# 1. 기존 프로젝트로 이동
cd existing-project

# 2. Claude Code 실행
claude

# 3. 에이전트 팀만 생성
> "FastAPI + React로 에이전트 팀만 만들어줘"

# 4. 기존 코드 기반으로 개발 진행
> /orchestrate T2.1 섹션 API 구현해줘
```

### 오케스트레이터 사용법

```bash
# 단일 태스크 실행
/orchestrate T1.1 인증 API 구현해줘

# 마일스톤 전체 실행
/orchestrate M1 전체 진행해줘

# 자유 형식 요청
/orchestrate 로그인 기능 구현해줘
```

### 개별 에이전트 직접 호출 (고급)

```bash
# CLI에서 직접 호출
claude --agent backend-specialist -p "Phase 1, T1.1: JWT 인증 구현"

# 세션 내에서 Task 도구 사용
Task(
  subagent_type: "frontend-specialist",
  prompt: "Phase 1, T1.2: 로그인 폼 구현"
)
```

---

## 아키텍처

### 디렉토리 구조

```
~/.claude/
├── agents/                          # 전역 에이전트
│   ├── backend-specialist.md
│   ├── frontend-specialist.md
│   ├── database-specialist.md
│   └── test-specialist.md
│
├── commands/                        # 전역 명령어
│   └── orchestrate.md               # 오케스트레이터
│
└── skills/
    └── project-bootstrap/           # 스킬 본체
        ├── SKILL.md                 # 스킬 정의
        ├── README.md                # 이 문서
        │
        ├── references/              # 에이전트 템플릿
        │   ├── orchestrate-command.md
        │   ├── backend-specialist.md
        │   ├── frontend-specialist.md
        │   ├── database-specialist.md
        │   ├── test-specialist.md
        │   ├── 3d-engine-specialist.md
        │   ├── integration-validator.md
        │   └── agent-lifecycle.md
        │
        ├── templates/               # 프로젝트 템플릿
        │   ├── backend/
        │   │   ├── fastapi/
        │   │   ├── express/
        │   │   └── rails/
        │   ├── frontend/
        │   │   ├── react-vite/
        │   │   ├── nextjs/
        │   │   ├── sveltekit/
        │   │   └── remix/
        │   └── contracts/
        │
        ├── scripts/                 # 설정 스크립트
        │   ├── setup_backend.py
        │   ├── setup_frontend.py
        │   ├── setup_docker.py
        │   ├── setup_mcp.py
        │   └── git_init.py
        │
        └── hooks/                   # 자동화 훅
            ├── session_init.py
            └── defense_in_depth_hook.sh
```

### 에이전트 호출 흐름

```
┌────────────────────────────────────────────────────────────────┐
│                        사용자 요청                              │
│                   "/orchestrate T1.2 진행해줘"                  │
└────────────────────────────┬───────────────────────────────────┘
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    Claude 메인 세션                             │
│                                                                │
│  1. /orchestrate 명령어 인식                                    │
│  2. orchestrate.md 로드                                        │
│  3. TASKS.md 읽어서 T1.2 분석                                  │
└────────────────────────────┬───────────────────────────────────┘
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                     Task 도구 호출                              │
│                                                                │
│  Task(                                                         │
│    subagent_type: "frontend-specialist",                       │
│    description: "Phase 1, T1.2: 로그인 UI",                    │
│    prompt: "..."                                               │
│  )                                                             │
└────────────────────────────┬───────────────────────────────────┘
                             ▼
┌────────────────────────────────────────────────────────────────┐
│               frontend-specialist 서브에이전트                  │
│                                                                │
│  1. Phase 1 확인 → Git Worktree 생성                           │
│  2. TDD 워크플로우:                                            │
│     - npm run test → 🔴 RED 확인                               │
│     - 구현 코드 작성                                           │
│     - npm run test → 🟢 GREEN 확인                             │
│  3. 커밋: "feat: T1.2 로그인 UI 구현 (GREEN)"                  │
└────────────────────────────────────────────────────────────────┘
```

---

## TDD 워크플로우

### Phase 0: 테스트 선행 작성 (T0.5.x)

```bash
# backend-specialist 또는 frontend-specialist가 실행

# 1. 테스트 파일만 작성 (구현 금지!)
# 2. 테스트 실행 → 반드시 FAIL
pytest tests/api/test_auth.py -v
# Expected: FAILED

# 3. RED 상태로 커밋
git add tests/
git commit -m "test: T0.5.2 인증 API 테스트 작성 (RED)"
```

### Phase 1+: 구현 (T*.1, T*.2)

```bash
# 1. 🔴 RED 확인 (테스트가 이미 있어야 함!)
pytest tests/api/test_auth.py -v
# Expected: FAILED

# 2. 구현 코드 작성
# app/api/routes/auth.py 등

# 3. 🟢 GREEN 확인
pytest tests/api/test_auth.py -v
# Expected: PASSED

# 4. GREEN 상태로 커밋
git add .
git commit -m "feat: T1.1 인증 API 구현 (GREEN)"
```

### TDD 검증 체크리스트

```
┌─────────────────────────────────────────────────────────────┐
│ T0.5.x (테스트 작성) 커밋 전:                                │
├─────────────────────────────────────────────────────────────┤
│ [ ] 테스트 파일만 staged? (구현 파일 없음?)                  │
│ [ ] pytest/npm run test 실행 시 FAILED?                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ T*.1/T*.2 (구현) 커밋 전:                                    │
├─────────────────────────────────────────────────────────────┤
│ [ ] 기존 테스트 파일 존재? (T0.5.x에서 작성됨)               │
│ [ ] pytest/npm run test 실행 시 PASSED?                     │
│ [ ] 새 테스트 파일 추가 안 함?                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Git Worktree 전략

### Phase별 브랜치 전략

```
main (master)
  │
  ├── Phase 0 작업 (직접 커밋)
  │   ├── T0.1 프로젝트 구조
  │   ├── T0.2 DB 설정
  │   └── T0.5.x 테스트 작성
  │
  ├── phase-1-auth (Worktree)
  │   ├── T1.1 인증 API
  │   ├── T1.2 로그인 UI
  │   └── T1.3 통합 검증
  │
  ├── phase-2-sections (Worktree)
  │   ├── T2.1 섹션 API
  │   ├── T2.2 섹션 UI
  │   └── T2.3 통합 검증
  │
  └── phase-3-projects (Worktree)
      └── ...
```

### Worktree 자동 생성

서브에이전트가 Phase 1+ 작업을 받으면 자동으로:

```bash
# 1. Worktree 존재 확인
git worktree list | grep phase-1

# 2. 없으면 생성
git worktree add ../project_phase-1-auth -b phase-1-auth main

# 3. 해당 경로에서 작업
cd ../project_phase-1-auth
```

### 병합

```bash
# Phase 완료 후 main에 병합
git checkout main
git merge phase-1-auth

# Worktree 정리
git worktree remove ../project_phase-1-auth
git branch -d phase-1-auth
```

---

## 지원 기술 스택

### 백엔드

| Framework | 인증 템플릿 | ORM | 설명 |
|-----------|------------|-----|------|
| FastAPI | ✅ | SQLAlchemy | Python + JWT + Alembic |
| Express | ✅ | Prisma | Node.js + TypeScript + JWT |
| Rails | ✅ | ActiveRecord | Ruby + Session/JWT |
| Django | ❌ | Django ORM | Python + DRF |

### 프론트엔드

| Framework | 인증 UI | 상태관리 | 설명 |
|-----------|--------|----------|------|
| React+Vite | ✅ | Zustand | React 19 + TailwindCSS |
| Next.js | ✅ | Zustand | App Router + TailwindCSS |
| SvelteKit | ✅ | Runes | Svelte 5 + TailwindCSS |
| Remix | ✅ | Loader/Action | TailwindCSS |

### 데이터베이스

| DB | Docker Template | 추가 기능 |
|----|-----------------|----------|
| PostgreSQL | `postgres` | 기본 |
| PostgreSQL + PGVector | `postgres-pgvector` | AI/RAG |
| PostgreSQL + Redis | `postgres-redis` | 캐시 |
| MySQL | `mysql` | 범용 |
| MongoDB | `mongodb` | NoSQL |
| SQLite | - | 로컬 개발 |

---

## 트러블슈팅

### Q: 오케스트레이터가 서브에이전트를 호출하지 않아요

**원인**: `.claude/agents/orchestrator.md`(커스텀 에이전트)를 사용 중

**해결**: `/orchestrate` 명령어 사용 (`.claude/commands/orchestrate.md`)

```bash
# ❌ 잘못된 방법
claude --agent orchestrator

# ✅ 올바른 방법
claude
> /orchestrate T1.1 진행해줘
```

### Q: TDD가 제대로 수행되지 않아요

**원인**: 에이전트가 테스트와 구현을 동시에 작성

**해결**: 에이전트 파일에 TDD 섹션 확인
- `~/.claude/agents/backend-specialist.md`
- `~/.claude/agents/frontend-specialist.md`

TDD 섹션이 없으면 최신 버전으로 업데이트:
```bash
cp ~/.claude/skills/project-bootstrap/references/backend-specialist.md ~/.claude/agents/
cp ~/.claude/skills/project-bootstrap/references/frontend-specialist.md ~/.claude/agents/
```

### Q: Git Worktree가 생성되지 않아요

**원인**: Phase 번호가 prompt에 포함되지 않음

**해결**: 오케스트레이터가 "Phase X, T.X.X" 형식으로 전달하는지 확인

```
# ✅ 올바른 형식
/orchestrate Phase 1, T1.2 로그인 UI 구현해줘

# 또는 TASKS.md에서 자동 파싱
/orchestrate T1.2 진행해줘
```

### Q: 에이전트가 확인 질문만 하고 실행하지 않아요

**원인**: 에이전트 지침의 "확인 질문 금지" 규칙 미적용

**해결**: 에이전트 파일의 다음 섹션 확인:
```markdown
## ⛔ 금지 사항 (작업 중)

- ❌ "진행할까요?" / "작업할까요?" 등 확인 질문
- ❌ 계획만 설명하고 실행 안 함
```

---

## 버전 히스토리

| 버전 | 날짜 | 변경 사항 |
|------|------|----------|
| 1.0.0 | 2025-01-09 | 초기 릴리즈 |
| 1.1.0 | 2025-01-09 | TDD 워크플로우 강제 추가 |
| 1.2.0 | 2025-01-09 | 오케스트레이터를 슬래시 명령어로 전환 |

---

## 관련 스킬

- `/socrates` - 21개 질문으로 프로젝트 기획 및 7개 문서 생성
- `/deep-research` - 5개 검색 API 병렬 리서치

---

## 라이센스

MIT License
