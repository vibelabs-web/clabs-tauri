---
name: ultra-thin-orchestrate
description: 200개 태스크도 오토 컴팩팅 없이 처리하는 초슬림 오케스트레이션 모드
trigger: /auto-orchestrate --ultra-thin
---

# Ultra-Thin Orchestrate

> **200개 태스크도 오토 컴팩팅 없이 처리!**
> 메인 에이전트 컨텍스트를 76% 절감하는 초슬림 모드

---

## 핵심 아이디어

```
┌─────────────────────────────────────────────────────────────────┐
│  일반 모드: 메인이 모든 걸 직접 처리 → 컨텍스트 폭발            │
│  Ultra-Thin: 메인은 교통정리만 → 서브가 모든 걸 처리            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  일반 모드 (50 Task): ~160K 토큰 → 컴팩팅 필수                  │
│  Ultra-Thin (200 Task): ~38K 토큰 → 컴팩팅 불필요               │
│                                                                 │
│  핵심: 서브에이전트가 TASKS.md를 직접 파싱하고,                 │
│        메인에게는 DONE/FAIL 한 줄만 반환                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 모드 선택 가이드

| Task 수 | 권장 모드 | 명령어 |
|---------|----------|--------|
| 1-30개 | 일반 모드 | `/auto-orchestrate` |
| 30-50개 | 일반 + 컴팩팅 | `/auto-orchestrate` + Phase별 `/compact` |
| **50-200개** | **Ultra-Thin** | `/auto-orchestrate --ultra-thin` |
| 200개+ | Ultra-Thin + 분할 | `--ultra-thin --phase N` |

---

## 초슬림 오케스트레이터 프롬프트

당신은 **초슬림 오케스트레이터**입니다.

### 절대 규칙

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨 최우선 규칙: 절대 멈추지 않음! ALL_DONE까지 무조건 진행!    │
├─────────────────────────────────────────────────────────────────┤
│  ❌ TASKS.md 직접 파싱 금지 (dependency-resolver가 함)          │
│  ❌ 상세 프롬프트 작성 금지 (Task ID만 전달)                    │
│  ❌ 결과 분석 금지 (task-executor가 함)                         │
│  ❌ 에러 디버깅 금지 (task-executor가 10회 재시도)              │
│  ❌ Phase 완료 시 AskUserQuestion 금지 (바로 다음 Phase!)       │
│  ❌ 사용자 확인 요청 금지 (무인 자동화 모드)                    │
├─────────────────────────────────────────────────────────────────┤
│  ✅ 상태 파일만 읽고 쓰기                                       │
│  ✅ Task ID만 전달하여 호출                                     │
│  ✅ DONE/FAIL 응답만 처리                                       │
│  ✅ Phase 완료 시 즉시 병합 → 즉시 다음 Phase 시작              │
│  ✅ ALL_DONE 수신 시에만 종료                                   │
└─────────────────────────────────────────────────────────────────┘
```

### ⛔ Ultra-Thin 모드에서 절대 금지

```
┌─────────────────────────────────────────────────────────────────┐
│  🚫 Phase 완료 시 멈춤 금지!                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  일반 auto-orchestrate:                                         │
│    Phase 완료 → AskUserQuestion → 사용자 선택 대기              │
│                                                                 │
│  Ultra-Thin 모드 (--ultra-thin):                                │
│    Phase 완료 → 즉시 병합 → 즉시 다음 Phase → 무한 루프         │
│    ALL_DONE 수신할 때까지 절대 멈추지 않음!                     │
│                                                                 │
│  ⚠️ 이 규칙은 auto-orchestrate의 Phase 완료 규칙보다 우선!      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 워크플로우

```
┌─────────────────────────────────────────────────────────────────┐
│  ULTRA-THIN ORCHESTRATION LOOP                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ INIT: 상태 파일 초기화                                      │
│     └── .claude/orchestrate-state.json 생성/로드               │
│                                                                 │
│  2️⃣ RESOLVE: 다음 Task 계산                                     │
│     └── dependency-resolver 호출 → "READY:T1.3,T1.4"           │
│                                                                 │
│  3️⃣ EXECUTE: Task 실행 (병렬)                                   │
│     └── task-executor 병렬 호출 → "DONE:T1.3", "DONE:T1.4"     │
│                                                                 │
│  4️⃣ CHECK: Phase 완료 확인                                      │
│     └── PHASE_DONE 시 → 병합 + 다음 Phase                      │
│                                                                 │
│  5️⃣ LOOP: 2-4 반복 until ALL_DONE                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 상세 루프 코드 (절대 멈추지 않음!)

```
# 🚨 CRITICAL: 이 루프는 ALL_DONE까지 절대 멈추지 않습니다!
# AskUserQuestion, 사용자 확인 요청 등 일체 금지!

INFINITE_LOOP:
  # Step 1: 다음 실행 가능 Task 조회
  result = Task(
    subagent_type="dependency-resolver",
    prompt="RESOLVE_NEXT"
  )

  # Step 2: 결과 처리
  if result == "ALL_DONE":
    → 최종 보고 출력
    → 여기서만 종료! (유일한 종료 조건)
    → EXIT

  if result.startsWith("PHASE_DONE"):
    → Phase 병합 처리 (자동)
    → Worktree 정리 (자동)
    → 슬랙 알림 전송 (자동)
    → 다음 Phase 설정 (자동)
    → ⚠️ 사용자 확인 없이 즉시 계속!
    → GOTO INFINITE_LOOP  # 절대 멈추지 않음!

  if result.startsWith("READY"):
    task_ids = result.split(":")[1].split(",")

  # Step 3: Task 백그라운드 실행 (🚨 핵심!)
  for task_id in task_ids:
    Task(
      subagent_type="task-executor",
      prompt=f"TASK_ID:{task_id}",
      run_in_background=true  # ← 🚨 필수! 컨텍스트 절약 핵심
    )

  # Step 4: 백그라운드 결과 확인 (output_file 읽기)
  for task in background_tasks:
    output = Read(task.output_file)  # 결과 파일만 읽음
    if "FAIL" in output:
      failed_tasks.append(output)
    # DONE은 무시 (task-executor가 이미 상태 업데이트함)

  # Step 5: 무조건 반복! (멈추지 않음!)
  GOTO INFINITE_LOOP
```

### 🚨 컨텍스트 절약의 핵심: run_in_background

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ run_in_background=true 없이 호출하면 컨텍스트 폭발!        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ 잘못된 방식 (오토컴팩팅 발생):                               │
│     Task(subagent_type="task-executor", prompt="...")           │
│     → task-executor 내부의 모든 작업이 메인에 반환됨            │
│     → 전문가 에이전트 호출 과정이 모두 컨텍스트에 쌓임          │
│                                                                 │
│  ✅ 올바른 방식 (컨텍스트 절약):                                 │
│     Task(                                                       │
│       subagent_type="task-executor",                            │
│       prompt="...",                                             │
│       run_in_background=true  ← 🚨 이거 필수!                   │
│     )                                                           │
│     → 백그라운드에서 실행, 결과는 output_file에 저장            │
│     → Read(output_file)로 "DONE:T1.3" 한 줄만 읽음              │
│     → 메인 컨텍스트에 쌓이지 않음!                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🚨 멈춤 방지 체크리스트

```
┌─────────────────────────────────────────────────────────────────┐
│  Ultra-Thin 루프에서 절대 하지 말아야 할 것:                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ AskUserQuestion 호출                                        │
│  ❌ "다음 단계를 선택해주세요" 출력                             │
│  ❌ "/compact 후 계속할까요?" 질문                              │
│  ❌ "Phase 완료! 계속할까요?" 확인                              │
│  ❌ 사용자 입력 대기                                            │
│  ❌ 중간에 멈추고 보고                                          │
│                                                                 │
│  ✅ 슬랙 알림만 전송 (비동기, 대기 없음)                        │
│  ✅ 상태 파일만 업데이트                                        │
│  ✅ 바로 다음 Task/Phase로 진행                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 전용 서브에이전트

### dependency-resolver

```
역할: TASKS.md 파싱 + 의존성 분석 + 실행 가능 Task 계산
입력: RESOLVE_NEXT
출력: READY:T1.3,T1.4 | PHASE_DONE:1 | ALL_DONE
```

### task-executor

```
역할: 개별 Task 완전 자율 수행
입력: TASK_ID:T1.3
출력: DONE:T1.3 | FAIL:T1.3:reason
내부: 전문가 에이전트 호출, TDD, 에러 재시도 (10회)
```

---

## 상태 파일

### 경로
```
.claude/orchestrate-state.json
```

### 스키마

```json
{
  "version": "2.0",
  "mode": "ultra-thin",
  "project": "my-project",

  "execution": {
    "current_phase": 1,
    "worktree": "worktree/phase-1-feature",
    "started_at": "2026-01-21T09:00:00Z"
  },

  "tasks": {
    "pending": ["T1.5", "T1.6"],
    "ready": ["T1.3", "T1.4"],
    "in_progress": [],
    "completed": ["T0.5.1", "T1.1", "T1.2"],
    "failed": []
  },

  "checkpoints": {
    "phase_0": {
      "completed_at": "2026-01-21T09:30:00Z",
      "tasks": 3,
      "merged": true
    }
  },

  "slack_webhook_url": "https://hooks.slack.com/..."
}
```

---

## 토큰 사용량 비교

### 일반 모드 (50 Task)

| 항목 | 토큰 |
|------|------|
| TASKS.md 파싱 | 5,000 |
| Task당 프롬프트 | 50 × 2,000 = 100,000 |
| Task당 결과 | 50 × 1,000 = 50,000 |
| 기타 | 5,000 |
| **총계** | **~160,000** |

### Ultra-Thin (200 Task)

| 항목 | 토큰 |
|------|------|
| 상태 파일 읽기 | 200 × 100 = 20,000 |
| Task 호출 | 200 × 50 = 10,000 |
| Task 결과 | 200 × 30 = 6,000 |
| 기타 | 2,000 |
| **총계** | **~38,000** |

**절감율: 76% (200개에서도 40K 이하!)**

---

## CLI 옵션

| 옵션 | 설명 |
|------|------|
| `--ultra-thin` | Ultra-Thin 모드 활성화 |
| `--phase N` | 특정 Phase만 실행 |
| `--resume` | 중단된 작업 재개 |
| `--dry-run` | 실행 계획만 출력 (실제 실행 안 함) |
| `--parallel N` | 최대 병렬 Task 수 (기본: 무제한) |

### 사용 예시

```bash
# 기본 Ultra-Thin 실행
/auto-orchestrate --ultra-thin

# 특정 Phase만
/auto-orchestrate --ultra-thin --phase 2

# 중단 후 재개
/auto-orchestrate --ultra-thin --resume

# 최대 3개 병렬
/auto-orchestrate --ultra-thin --parallel 3
```

---

## Phase 완료 처리

### Phase 병합 워크플로우

```
PHASE_DONE:1 수신 시:
├── 1. 테스트 실행 (Worktree에서)
├── 2. 빌드 확인
├── 3. main으로 병합
├── 4. Worktree 정리
├── 5. 슬랙 알림
└── 6. 상태 파일 업데이트
```

### 병합 명령어

```bash
cd worktree/phase-1-feature
npm test && npm run build
cd ../..
git merge phase-1-feature --no-ff -m "Phase 1 완료"
git worktree remove worktree/phase-1-feature
```

---

## 에러 처리

### 서브에이전트 실패 시

```
FAIL:T1.3:TypeError - Cannot read property...
    ↓
1. failed_tasks에 추가
2. 계속 진행 (다른 Task 영향 없음)
3. 최종 보고에서 실패 목록 표시
```

### 의존성 Task 실패 시

```
T1.3 실패 → T1.5 (T1.3에 의존) 영향
    ↓
dependency-resolver가 자동 처리:
├── T1.5를 pending에서 blocked로 이동
└── T1.4 등 다른 Task는 계속 진행
```

---

## 완료 보고 형식

```
═══════════════════════════════════════════════════════
  🎉 Ultra-Thin Orchestrate 완료!
═══════════════════════════════════════════════════════

📊 결과 요약:
   총 태스크: 150개
   성공: 148개 (99%)
   실패: 2개

❌ 실패 태스크:
   - T2.5: Redis 연결 실패
   - T3.2: Stripe API 키 필요

📈 컨텍스트 절약:
   일반 모드 예상: ~300K 토큰
   실제 사용: ~35K 토큰
   절감: 88%

═══════════════════════════════════════════════════════
```

---

## 참조 문서

| 문서 | 내용 |
|------|------|
| `references/state-schema.md` | 상태 파일 상세 스키마 |
| `references/protocol.md` | 서브에이전트 통신 프로토콜 |
| `../auto-orchestrate/SKILL.md` | 기본 오케스트레이션 (호환) |

---

## 제한사항

1. **Ultra-Thin 전용 에이전트 필요**: task-executor, dependency-resolver
2. **상태 파일 의존**: orchestrate-state.json 손상 시 복구 어려움
3. **디버깅 어려움**: 상세 로그가 메인에 전달되지 않음
4. **Worktree 필수**: Phase별 Git Worktree 사용

---

## 호환성

```
┌─────────────────────────────────────────────────────────────────┐
│  기존 시스템과 100% 호환!                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ 기존 전문가 에이전트 6개 → 변경 없이 사용                   │
│  ✅ 기존 TASKS.md 형식 → 그대로 사용                            │
│  ✅ 기존 기획 문서 → 그대로 사용                                │
│  ✅ 기존 /auto-orchestrate → 여전히 동작                        │
│                                                                 │
│  🆕 --ultra-thin 옵션 → 새 모드 활성화                          │
│  🆕 task-executor → Ultra-Thin 전용 추가                        │
│  🆕 dependency-resolver → Ultra-Thin 전용 추가                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 활성화 조건

다음 조건에서 Ultra-Thin 모드 권장:
- Task 수 50개 이상
- 컨텍스트 오버플로우 경험
- 장시간 무인 실행 필요

다음 조건에서는 일반 모드 권장:
- Task 수 30개 미만
- 상세 로그 필요
- 디버깅/학습 목적
