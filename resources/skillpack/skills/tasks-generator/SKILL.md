---
name: tasks-generator
description: Domain-Guarded 화면 단위 태스크 구조로 TASKS.md를 생성합니다. 화면 요구사항과 도메인 리소스 간 Interface Contract Validation을 수행합니다.
---

# Tasks Generator: Domain-Guarded 태스크 생성

> "화면이 주도하되, 도메인이 방어한다"
> 백엔드 API가 화면에 종속되지 않으면서 화면 중심 개발을 가능하게 하는 구조

## 역할

기획 문서 또는 **기존 코드베이스**를 분석하여 오케스트레이터와 서브 에이전트가 사용할 **TASKS.md**를 생성합니다.

### v2.0 핵심 변경

| 영역 | v1.0 | v2.0 |
|------|------|------|
| **Task 구조** | 화면 결합 (P2-S1-T1: Backend) | 분리 (P2-R1: Resource, P2-S1: Screen) |
| **검증** | 연결점만 검증 | **Domain Coverage + 연결점 검증** |
| **워크플로우** | 화면 명세 직접 변환 | **Interface Contract Validation 포함** |

---

## 실행 모드

### 자동 감지 (기본)

```bash
/tasks-generator
```

1. `specs/domain/resources.yaml` 확인
2. `specs/screens/` 폴더 확인
3. 화면 명세 YAML이 있으면 → **Domain-Guarded 모드** (권장!)
4. `docs/planning/` 폴더만 있으면 → **문서 기반 모드**
5. 둘 다 없으면 → **코드 분석 모드**

### 명시적 모드 선택

```bash
/tasks-generator from-screens  # Domain-Guarded (권장!)
/tasks-generator from-docs     # 기획 문서 기반
/tasks-generator analyze       # 코드 분석 기반
```

---

## Domain-Guarded 워크플로우 (권장!)

| Phase | 설명 | 주요 작업 |
|-------|------|----------|
| **Phase 0** | Domain Resources 확인 | `resources.yaml`에서 리소스 목록 추출 |
| **Phase 1** | Screen 명세 추출 | 각 화면의 `data_requirements` 추출 |
| **Phase 2** | Interface Contract Validation | 화면 needs vs 리소스 fields 검증 (**실패 시 중단!**) |
| **Phase 3** | Backend Resource 태스크 생성 | P{N}-R{M}-T{X} 형식 |
| **Phase 4** | Frontend Screen 태스크 생성 | P{N}-S{M}-T{X} 형식 |
| **Phase 5** | Verification 태스크 생성 | P{N}-S{M}-V 형식 |

> **상세 내용**: `references/phase-details.md` 참조

---

## Task ID 형식

| 형식 | 용도 | 예시 |
|------|------|------|
| `P{N}-R{M}-T{X}` | Backend Resource | P2-R1-T1: Products API |
| `P{N}-S{M}-T{X}` | Frontend Screen | P2-S1-T1: Product List UI |
| `P{N}-S{M}-V` | Screen Verification | P2-S1-V: 연결점 검증 |

### Phase 할당 규칙

| 유형 | Phase | 예시 |
|------|-------|------|
| 프로젝트 셋업 | P0 | P0-T0.1 |
| 공통 리소스 (Auth) | P1 | P1-R1: Auth Resource |
| 공통 레이아웃 | P1 | P1-S0: 공통 레이아웃 |
| 핵심 기능 | P2+ | P2-R1, P2-S1 |

---

## 병렬 실행 규칙

| 태스크 유형 | 병렬 가능 | 조건 |
|------------|----------|------|
| Resource 태스크간 | ✅ | 서로 의존하지 않으면 |
| Screen 태스크 | ❌ | Resource 완료 후 |
| 같은 Screen의 UI/Test | ❌ | UI 완료 후 Test |
| Verification | ❌ | 모든 관련 태스크 완료 후 |

---

## 핵심 규칙 (공통)

### TDD 워크플로우

```
Phase 1+ 태스크는 반드시:
1. RED: 테스트 먼저 작성 (실패 확인)
2. GREEN: 최소 구현 (테스트 통과)
3. REFACTOR: 리팩토링 (테스트 유지)
```

### Domain-Guarded 규칙

```
1. Interface Contract Validation 통과 필수
2. Resource 태스크와 Screen 태스크 분리
3. Backend 헌법 (api-design.md) 준수
4. Field Coverage 검증 포함
```

---

## 참조 파일

| 파일 | 설명 |
|------|------|
| [phase-details.md](./references/phase-details.md) | Phase별 상세 가이드 |
| [tasks-rules.md](./references/tasks-rules.md) | 태스크 규칙 |
| [screen-based-tasks.md](./references/screen-based-tasks.md) | 화면 기반 태스크 |
| [domain-resource-validation.md](./references/domain-resource-validation.md) | 도메인 리소스 검증 |
| [connection-verification.md](./references/connection-verification.md) | 연결점 검증 |

---

## 다음 단계 (필수!)

TASKS.md 생성 완료 후 **반드시** AskUserQuestion으로 다음 단계를 제안:

```json
{
  "questions": [{
    "question": "TASKS.md 생성이 완료되었습니다!\n\n다음 단계를 선택해주세요:",
    "header": "다음 단계",
    "options": [
      {"label": "/project-bootstrap 실행 (권장)", "description": "프로젝트 환경 셋업 (백엔드/프론트엔드/Docker)"},
      {"label": "/auto-orchestrate 실행", "description": "이미 환경 셋업이 완료된 경우, 바로 자동 개발 시작"},
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
