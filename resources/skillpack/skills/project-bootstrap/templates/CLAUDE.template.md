# CLAUDE.md

> 이 파일은 Claude Code가 프로젝트 컨텍스트를 빠르게 파악하도록 돕습니다.

## 프로젝트 개요

- **이름**: {{PROJECT_NAME}}
- **설명**: {{PROJECT_DESCRIPTION}}
- **기술 스택**: {{TECH_STACK}}

## 빠른 시작

```bash
# 설치
{{INSTALL_COMMAND}}

# 개발 서버
{{DEV_COMMAND}}

# 테스트
{{TEST_COMMAND}}
```

## 프로젝트 구조

```
{{PROJECT_STRUCTURE}}
```

## 컨벤션

- 커밋 메시지: Conventional Commits
- 브랜치 전략: feature/*, fix/*, phase/*
- 코드 스타일: Prettier (TS), Ruff (Python)

---

## 🔄 Auto-Orchestrate 진행 상황

> 이 섹션은 `/auto-orchestrate` 실행 시 자동으로 업데이트됩니다.
> 새 세션에서 `--resume` 옵션으로 이어서 실행할 수 있습니다.

### 완료된 Phase

| Phase | 태스크 | 완료일 | 주요 내용 |
|-------|--------|--------|----------|
| - | - | - | 아직 실행된 Phase 없음 |

### 현재 Phase

- 아직 시작되지 않음

### 주요 결정사항

- (자동 기록됨)

### 실패한 태스크

| 태스크 | 에러 | 시도 |
|--------|------|------|
| - | - | - |

### 재개 명령어

```bash
/auto-orchestrate --resume
```

---

## Lessons Learned

> 에이전트가 난관을 극복하며 발견한 교훈을 기록합니다.
> 같은 실수를 반복하지 않도록 짧고 검색 가능하게 작성합니다.

### 작성 형식

```markdown
### [YYYY-MM-DD] 제목 (키워드)
- **상황**: 무엇을 하려다 문제가 발생했는가
- **문제**: 어떤 에러/이슈가 발생했는가
- **원인**: 왜 발생했는가 (root cause)
- **해결**: 어떻게 해결했는가
- **교훈**: 다음에 주의할 점
```

### 예시

```markdown
### [2024-01-09] SQLAlchemy async detached instance (async, session, ORM)
- **상황**: 비동기 세션에서 관계 객체 접근 시도
- **문제**: `DetachedInstanceError: Instance is not bound to a Session`
- **원인**: `expire_on_commit=True`(기본값)로 커밋 후 객체가 만료됨
- **해결**: `async_sessionmaker(expire_on_commit=False)` 설정
- **교훈**: 비동기 ORM에서는 항상 `expire_on_commit=False` 사용

### [2024-01-08] Vite CORS 프록시 설정 (Vite, CORS, proxy)
- **상황**: 프론트에서 백엔드 API 호출
- **문제**: `Access-Control-Allow-Origin` CORS 에러
- **원인**: 개발 서버가 다른 포트에서 실행되어 cross-origin 요청 발생
- **해결**: `vite.config.ts`에 `server.proxy` 설정 추가
- **교훈**: 풀스택 개발 시 프록시 설정 먼저 확인
```

---

<!-- 아래에 실제 교훈을 기록합니다 -->

