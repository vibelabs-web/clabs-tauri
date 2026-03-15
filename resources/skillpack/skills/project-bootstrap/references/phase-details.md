# Project-Bootstrap Phase 상세 가이드

> SKILL.md에서 분리된 단계별 상세 내용입니다.

---

## 1단계: 기술 스택 확인

### Case A: 기술 스택이 명시된 경우

예: "FastAPI + React로 에이전트 팀 만들어줘"
→ 2단계로 진행

### Case B: 기술 스택이 명시되지 않은 경우

예: "에이전트 팀 만들어줘"

```
기술 스택이 지정되지 않았습니다.
먼저 /socrates로 프로젝트 기획을 진행하겠습니다.
21개 질문을 통해 요구사항을 정리하고, 적합한 기술 스택을 추천해 드립니다.
```

→ `/socrates` 스킬 발동
→ 완료 후 2단계 진행

---

## 2단계: 하위 기술 스택 선택

### 질문 2-1: 데이터베이스 선택

```
어떤 데이터베이스를 사용하시겠습니까?

1. PostgreSQL (권장) - 벡터 DB 지원, 확장성
2. MySQL - 범용 관계형 DB
3. SQLite - 로컬 개발, Rails 8 WAL 모드 지원
4. MongoDB - NoSQL 문서 DB
5. MariaDB - MySQL 호환, 오픈소스 친화적
6. Supabase - PostgreSQL 기반 BaaS, 실시간 구독
7. Firebase - Google NoSQL, 실시간 동기화
```

### 질문 2-2: 인증 포함 여부

```
인증 기능(로그인/회원가입/프로필)을 포함할까요?

1. 예 (권장) - JWT 인증 + 로그인/회원가입/프로필 페이지
2. 아니오 - 인증 없이 기본 구조만
```

### 질문 2-3: 추가 기능 선택 (다중 선택)

```
추가로 필요한 기능이 있나요? (복수 선택 가능)

1. 벡터 DB (PGVector) - AI/RAG 애플리케이션용
2. Redis 캐시 - 세션/캐시 저장소
3. 3D 엔진 (Three.js) - 3D 시각화
4. 없음
```

### 질문 2-4: MCP 서버 선택 (다중 선택)

```
추가 MCP 서버를 설정할까요? (복수 선택 가능)

1. Gemini 3 Pro (권장) - Google OAuth 로그인, 프론트엔드 디자인 AI
2. GitHub - GitHub API 연동 (GITHUB_TOKEN 필요)
3. PostgreSQL - DB 직접 쿼리 (DATABASE_URL 필요)
4. 기본값만 - Context7 + Playwright
```

---

## 3단계: 프로젝트 셋업 확인

```
프로젝트 환경을 셋업할까요?

1. 예 (권장) - 에이전트 팀 + 백엔드 + 프론트엔드 + Docker
2. 에이전트 팀만 - .claude/agents/ 파일만 생성
```

---

## 4단계: 프로젝트 생성

### 4-1. 에이전트 팀 생성

```
.claude/
  agents/
    backend-specialist.md
    frontend-specialist.md
    database-specialist.md
    test-specialist.md
    3d-engine-specialist.md (3D 선택 시)
  commands/
    orchestrate.md          ← 커맨드로 설치!
    integration-validator.md
    agent-lifecycle.md
  memory/
    project.md
    preferences.md
    patterns.md
    decisions.md
    learnings.md
```

### 4-2. MCP 서버 설정

```bash
# 기본값만 선택 시
python3 ~/.claude/skills/project-bootstrap/scripts/setup_mcp.py -p .

# Gemini 선택 시
python3 ~/.claude/skills/project-bootstrap/scripts/setup_mcp.py -p . --include gemini
```

### 4-3. Docker Compose 생성

```bash
python3 ~/.claude/skills/project-bootstrap/scripts/setup_docker.py -t <template> -p .
```

| 선택 | Template |
|------|----------|
| PostgreSQL | `postgres` |
| PostgreSQL + 벡터 | `postgres-pgvector` |
| MySQL | `mysql` |
| MongoDB | `mongodb` |

### 4-4. 백엔드 생성

```bash
python3 ~/.claude/skills/project-bootstrap/scripts/setup_backend.py -f <framework> -p ./backend [--with-auth]
```

### 4-5. 프론트엔드 생성

```bash
python3 ~/.claude/skills/project-bootstrap/scripts/setup_frontend.py -f <framework> -p ./frontend [--with-auth]
```

### 4-6. Git 초기화

```bash
python3 ~/.claude/skills/project-bootstrap/scripts/git_init.py -g fullstack -m "Initial commit"
```

---

## 5단계: 의존성 설치 확인

```
✅ 프로젝트 셋업이 완료되었습니다!

의존성 설치와 DB 마이그레이션을 진행할까요?

1. 예 - Docker 시작 + 의존성 설치 + DB 마이그레이션
2. 아니오 - 나중에 수동으로 진행
```

---

## 6단계: 다음 단계 선택

```
✅ 프로젝트 셋업이 완료되었습니다!

다음 단계를 선택해주세요:

1. /auto-orchestrate 실행 (권장) - TASKS.md 기반 자동 개발
2. 수동으로 진행 - 직접 개발
```

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
