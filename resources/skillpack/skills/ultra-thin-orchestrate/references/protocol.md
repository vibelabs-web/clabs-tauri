# Ultra-Thin Orchestrate 통신 프로토콜

> **서브에이전트 간 최소 토큰 통신 규약**
> 메인 에이전트 컨텍스트 절약을 위한 핵심

---

## 프로토콜 개요

```
┌─────────────────────────────────────────────────────────────────┐
│  Ultra-Thin 프로토콜의 핵심: 최소 문자열 교환                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  요청: "TASK_ID:T1.3" (15자)                                    │
│  응답: "DONE:T1.3" (10자)                                       │
│                                                                 │
│  vs 일반 모드:                                                  │
│  요청: 2,000+ 토큰 상세 프롬프트                                │
│  응답: 1,000+ 토큰 상세 보고                                    │
│                                                                 │
│  절감: 99%+                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 에이전트 간 통신 구조

```
┌──────────────────┐
│ Main Orchestrator│
│  (Ultra-Thin)    │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│Resolve│ │Execute│
│ Agent │ │ Agent │
└───────┘ └───┬───┘
              │
    ┌────┬────┼────┬────┐
    │    │    │    │    │
  ┌─▼─┐┌─▼─┐┌─▼─┐┌─▼─┐┌─▼─┐
  │BE ││FE ││DB ││QA ││SEC│
  └───┘└───┘└───┘└───┘└───┘
  (기존 전문가 에이전트들)
```

---

## 1. Main → Dependency-Resolver

### 요청 형식

```
RESOLVE_NEXT
```

또는

```
RESOLVE_NEXT:PHASE:2
```

또는

```
RESOLVE_NEXT:FORCE
```

### 응답 형식

| 상황 | 응답 |
|------|------|
| 실행 가능 Task 있음 | `READY:T1.3,T1.4,T1.5` |
| 현재 Phase 완료 | `PHASE_DONE:1` |
| 모든 Task 완료 | `ALL_DONE` |
| 에러 | `ERROR:reason` |

### 예시

```
Main → Resolver: RESOLVE_NEXT
Resolver → Main: READY:T1.3,T1.4
```

---

## 2. Main → Task-Executor

### 요청 형식

```
TASK_ID:T1.3
```

또는 (Worktree 포함)

```
TASK_ID:T1.3
WORKTREE:worktree/phase-1-auth
```

### 응답 형식

| 상황 | 응답 |
|------|------|
| 성공 | `DONE:T1.3` |
| 실패 | `FAIL:T1.3:reason` |

### 예시

```
Main → Executor: TASK_ID:T1.3
Executor → Main: DONE:T1.3
```

```
Main → Executor: TASK_ID:T2.5
Executor → Main: FAIL:T2.5:Redis connection refused
```

---

## 3. Task-Executor → Specialist Agents

Task-Executor 내부에서 전문가 에이전트 호출:

### 요청 (내부)

```
Task({
  subagent_type: "backend-specialist",
  description: "T1.3: 사용자 인증 API",
  prompt: """
## 태스크 정보
- **Phase**: 1
- **태스크 ID**: P1-T1.3
- **Worktree**: worktree/phase-1-auth

## 작업 내용
JWT 기반 인증 API 구현
- POST /api/auth/login
- POST /api/auth/register
...
"""
})
```

### 응답 (내부)

전문가 에이전트의 응답은 Task-Executor가 내부적으로 처리.
메인에게는 DONE/FAIL만 전달.

---

## 메시지 형식 상세

### RESOLVE_NEXT 요청

```ebnf
resolve_request ::= "RESOLVE_NEXT" [":PHASE:" phase_number] [":FORCE"]
phase_number    ::= digit+
```

### READY 응답

```ebnf
ready_response ::= "READY:" task_id_list
task_id_list   ::= task_id ("," task_id)*
task_id        ::= "T" digit+ "." digit+ ["." digit+]
```

### TASK_ID 요청

```ebnf
task_request   ::= "TASK_ID:" task_id [newline "WORKTREE:" path]
task_id        ::= "T" digit+ "." digit+ ["." digit+]
path           ::= string
```

### DONE/FAIL 응답

```ebnf
task_response  ::= done_response | fail_response
done_response  ::= "DONE:" task_id
fail_response  ::= "FAIL:" task_id ":" reason
reason         ::= string (최대 100자)
```

---

## 병렬 실행 프로토콜

### 병렬 요청

Main에서 단일 메시지로 여러 Task 호출:

```
[동시에 발송]
Task(prompt="TASK_ID:T1.3") →
Task(prompt="TASK_ID:T1.4") →
Task(prompt="TASK_ID:T1.5") →
```

### 병렬 응답 수집

```
← DONE:T1.3
← DONE:T1.4
← FAIL:T1.5:Connection timeout
```

### 그룹화된 Ready 응답

```
Resolver → Main: READY:T1.3,T1.4|T1.5,T1.6

해석:
- Group 1: [T1.3, T1.4] - 즉시 병렬 실행 가능
- Group 2: [T1.5, T1.6] - Group 1 완료 후 실행
```

---

## 에러 프로토콜

### 에러 코드

| 코드 | 설명 |
|------|------|
| `ERROR:TASKS_NOT_FOUND` | TASKS.md 파일 없음 |
| `ERROR:CIRCULAR_DEP` | 순환 의존성 감지 |
| `ERROR:MISSING_DEP` | 누락된 의존성 |
| `ERROR:PARSE_FAIL` | TASKS.md 파싱 실패 |
| `ERROR:STATE_CORRUPT` | 상태 파일 손상 |

### 에러 응답 형식

```
ERROR:CIRCULAR_DEP:T1.3->T1.4->T1.3
```

### 에러 처리 흐름

```
Resolver → Main: ERROR:CIRCULAR_DEP:T1.3->T1.4->T1.3
    ↓
Main: 사용자에게 에러 보고, TASKS.md 수정 요청
```

---

## 상태 파일 동기화

### 상태 업데이트 규칙

1. **dependency-resolver**: ready, pending 필드 업데이트
2. **task-executor**: in_progress, completed, failed 필드 업데이트
3. **main**: execution, checkpoints 필드 업데이트

### 동시성 제어

```
잠금 파일: .claude/orchestrate-state.json.lock

1. 잠금 획득 시도 (최대 5초 대기)
2. 상태 파일 읽기
3. 수정
4. 상태 파일 쓰기
5. 잠금 해제
```

---

## 체크포인트 프로토콜

### Phase 완료 시

```
Resolver → Main: PHASE_DONE:1
    ↓
Main:
  1. Worktree에서 테스트 실행
  2. main 병합
  3. Slack 알림 (설정된 경우)
  4. 상태 파일 업데이트
  5. 다음 Phase Worktree 설정
    ↓
Main → Resolver: RESOLVE_NEXT
```

### 전체 완료 시

```
Resolver → Main: ALL_DONE
    ↓
Main:
  1. 최종 보고 출력
  2. 메트릭 계산
  3. Slack 알림
  4. 종료
```

---

## 토큰 사용량 계산

### 요청 토큰

| 메시지 | 토큰 (추정) |
|--------|-------------|
| `RESOLVE_NEXT` | ~5 |
| `TASK_ID:T1.3` | ~10 |
| `READY:T1.3,T1.4,T1.5` | ~15 |
| `DONE:T1.3` | ~5 |
| `FAIL:T1.3:reason` | ~20 |

### 일반 모드 vs Ultra-Thin

| 항목 | 일반 모드 | Ultra-Thin | 절감 |
|------|----------|------------|------|
| Task 호출 | 2,000 | 10 | 99.5% |
| Task 응답 | 1,000 | 5 | 99.5% |
| 총 (200 Task) | ~600K | ~6K | 99% |

---

## 프로토콜 확장

### 커스텀 메시지

```
CUSTOM:type:payload
```

예시:
```
CUSTOM:PRIORITY:T1.3  # 우선순위 상향 요청
CUSTOM:SKIP:T1.5      # Task 건너뛰기 요청
CUSTOM:RETRY:T1.3     # 수동 재시도 요청
```

### 메타데이터 전달

```
TASK_ID:T1.3
META:{"priority":"high","timeout":300}
```

---

## 디버깅 모드

### 상세 로깅 활성화

```
/auto-orchestrate --ultra-thin --verbose
```

상세 모드에서는 추가 정보 포함:

```
DONE:T1.3:elapsed=120s:tests=15
FAIL:T1.3:elapsed=300s:retries=10:Redis connection refused
```

### 로그 파일

```
.claude/orchestrate.log

[2026-01-21T10:00:00] RESOLVE_NEXT
[2026-01-21T10:00:01] READY:T1.3,T1.4
[2026-01-21T10:00:02] EXECUTE:T1.3
[2026-01-21T10:00:02] EXECUTE:T1.4
[2026-01-21T10:02:30] DONE:T1.3
[2026-01-21T10:03:15] DONE:T1.4
```

---

## 호환성 매트릭스

| 에이전트 | 버전 | 프로토콜 |
|----------|------|----------|
| main (ultra-thin) | 2.0 | Full |
| dependency-resolver | 2.0 | RESOLVE/READY |
| task-executor | 2.0 | TASK_ID/DONE/FAIL |
| backend-specialist | 1.x | Legacy (내부 변환) |
| frontend-specialist | 1.x | Legacy (내부 변환) |
| 기타 전문가 | 1.x | Legacy (내부 변환) |

**Note**: 기존 전문가 에이전트는 수정 없이 task-executor가 내부적으로 호출
