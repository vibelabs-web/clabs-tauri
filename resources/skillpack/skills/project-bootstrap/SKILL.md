---
name: project-bootstrap
description: 프로젝트용 AI 에이전트 팀 구조(.claude/agents/)를 자동 생성하고, 선택적으로 실제 프로젝트 환경까지 셋업. "에이전트 팀 만들어줘", "에이전트 팀 구성", "에이전트 팀 생성" 등 반드시 "에이전트 팀"이라는 키워드가 포함된 요청에만 반응.
---

# Project Bootstrap Skill

사용자가 "에이전트 팀 만들어줘"를 요청하면 이 스킬이 발동된다.

## 필수 실행 규칙

**중요: 이 스킬은 반드시 아래 단계를 순서대로 실행해야 한다. 단계를 건너뛰지 말 것.**

---

## 워크플로우 개요

| 단계 | 설명 | 주요 작업 |
|------|------|----------|
| **1단계** | 기술 스택 확인 | 명시 여부 확인 → 없으면 /socrates 발동 |
| **2단계** | 하위 기술 스택 선택 | DB, 인증, 추가 기능, MCP 서버 선택 |
| **3단계** | 프로젝트 셋업 확인 | 전체 셋업 vs 에이전트 팀만 |
| **4단계** | 프로젝트 생성 | 에이전트 팀, MCP, Docker, 백엔드, 프론트엔드, Git |
| **5단계** | 의존성 설치 확인 | Docker + 의존성 + 마이그레이션 |
| **6단계** | 다음 단계 선택 | /auto-orchestrate 또는 수동 진행 |

> **상세 내용**: `references/phase-details.md` 참조

---

## 1단계: 기술 스택 확인

### Case A: 기술 스택 명시됨
예: "FastAPI + React로 에이전트 팀 만들어줘" → **2단계로 진행**

### Case B: 기술 스택 미명시 (⚠️ 필수)
예: "에이전트 팀 만들어줘"

```
기술 스택이 지정되지 않았습니다.
먼저 /socrates로 프로젝트 기획을 진행하겠습니다.
```

→ `/socrates` 스킬 발동 → 완료 후 2단계 진행

---

## 4단계: 프로젝트 생성 요약

### 4-1. 에이전트 팀 생성 (항상 실행)

```
.claude/
  agents/
    backend-specialist.md
    frontend-specialist.md
    database-specialist.md
    test-specialist.md
  commands/
    orchestrate.md          ← 커맨드로 설치!
    integration-validator.md
    agent-lifecycle.md
  memory/                   ← Memory 스킬용
  metrics/                  ← Evaluation 스킬용
  goals/                    ← Goal Setting 스킬용
```

### 4-2 ~ 4-6: 스크립트 실행

| 단계 | 스크립트 | 용도 |
|------|----------|------|
| 4-2 | `setup_mcp.py` | MCP 서버 설정 |
| 4-3 | `setup_docker.py` | Docker Compose 생성 |
| 4-4 | `setup_backend.py` | 백엔드 생성 |
| 4-5 | `setup_frontend.py` | 프론트엔드 생성 |
| 4-6 | `git_init.py` | Git 초기화 |

---

## 지원 기술 스택

### 백엔드 (✓ = 인증 템플릿 포함)

| Framework | Auth | 설명 |
|-----------|------|------|
| FastAPI ✓ | ✅ | Python + SQLAlchemy + JWT + Alembic |
| Express ✓ | ✅ | Node.js + TypeScript + JWT |
| Rails ✓ | ✅ | Ruby on Rails 8 + JWT/Session |
| Django | ❌ | Python + DRF |
| Go Echo | ❌ | Go + Echo v4 + JWT |

### 프론트엔드 (✓ = 인증 UI 포함)

| Framework | Auth | 설명 |
|-----------|------|------|
| React+Vite ✓ | ✅ | React 19 + Zustand + TailwindCSS |
| Next.js ✓ | ✅ | App Router + Zustand + TailwindCSS |
| SvelteKit ✓ | ✅ | Svelte 5 runes + TailwindCSS |
| Remix ✓ | ✅ | Loader/Action 패턴 + TailwindCSS |

### 데이터베이스

| DB | Docker Template | 비고 |
|----|-----------------|------|
| PostgreSQL | `postgres` | 권장 |
| PostgreSQL + PGVector | `postgres-pgvector` | AI/RAG용 |
| MySQL | `mysql` | 범용 |
| MongoDB | `mongodb` | NoSQL |
| Supabase | - | 클라우드 BaaS |
| Firebase | - | 클라우드 NoSQL |

---

## 스크립트/템플릿 경로

```
~/.claude/skills/project-bootstrap/
├── scripts/
│   ├── setup_backend.py
│   ├── setup_frontend.py
│   ├── setup_docker.py
│   ├── setup_mcp.py
│   └── git_init.py
└── references/
    ├── phase-details.md          ← 단계별 상세 가이드
    ├── orchestrate-command.md    ← 커맨드용
    ├── backend-specialist.md
    ├── frontend-specialist.md
    ├── database-specialist.md
    └── test-specialist.md
```

---

## 참조 파일

| 파일 | 설명 |
|------|------|
| [phase-details.md](./references/phase-details.md) | 단계별 상세 가이드 |
| [orchestrate-command.md](./references/orchestrate-command.md) | 오케스트레이터 커맨드 |

---

## 다음 단계 (필수!)

프로젝트 셋업 완료 후 **반드시** AskUserQuestion으로 다음 단계를 제안:

```json
{
  "questions": [{
    "question": "프로젝트 셋업이 완료되었습니다!\n\n다음 단계를 선택해주세요:",
    "header": "다음 단계",
    "options": [
      {"label": "/auto-orchestrate 실행 (권장)", "description": "TASKS.md 기반 자동 개발"},
      {"label": "수동으로 진행", "description": "직접 개발 진행"}
    ],
    "multiSelect": false
  }]
}
```

**권장 워크플로우:**
```
/socrates → /screen-spec → /tasks-generator → /project-bootstrap → /auto-orchestrate
```
