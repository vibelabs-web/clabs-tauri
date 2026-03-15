---
name: ralph-loop
description: Geoffrey Huntley의 자율 AI 에이전트 반복 루프 패턴. 완료될 때까지 끝까지 반복.
trigger: auto-orchestrate에서 --ralph 옵션 사용 시 또는 복잡한 태스크 처리 시
---

# RALPH 루프 패턴

> **RALPH**: Geoffrey Huntley의 자율 AI 에이전트 루프 패턴
> 참조: https://github.com/snarktank/ralph
> 공식 플러그인: https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum

---

## 핵심 원칙

```
┌─────────────────────────────────────────────────────────────────┐
│  RALPH = "끝까지 반복" + 학습 전달 + 완료 신호                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 끝까지 반복: 완료 신호 나올 때까지 최대 N회 반복            │
│  2. 완료 신호: "TASK_DONE" 출력 시에만 다음 태스크로            │
│  3. 학습 전달: progress.txt로 이전 반복의 교훈 전달             │
│  4. 상태 추적: TASKS.md [x] 체크 + orchestrate-state.json      │
│  5. 즉각적 검증: 테스트/타입체크 통과해야 완료 신호 출력        │
│                                                                 │
│  ⚠️ 핵심: 3회 실패 → 건너뛰기 (X)                               │
│         50회까지 반복 → 완료될 때까지 (O)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 워크플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                    RALPH 반복 사이클                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ 상태 로드                                                   │
│     ├── orchestrate-state.json 읽기 (완료/실패 태스크)          │
│     ├── progress.txt 읽기 (이전 학습 내용)                      │
│     └── TASKS.md에서 미완료 태스크 중 최우선순위 선택           │
│                                                                 │
│  2️⃣ 반복 루프 시작 (핵심!)                                      │
│     ┌───────────────────────────────────────────────────────┐   │
│     │  iteration = 0                                         │   │
│     │  while iteration < max_iterations (기본 50):          │   │
│     │      │                                                 │   │
│     │      ├── 에이전트 호출 (이전 출력 포함)                │   │
│     │      │   Task(prompt="{태스크} + {이전 출력}")         │   │
│     │      │                                                 │   │
│     │      ├── 출력에서 completion_promise 검색              │   │
│     │      │   if "TASK_DONE" in output:                    │   │
│     │      │       break  # 성공! 루프 탈출                  │   │
│     │      │                                                 │   │
│     │      ├── progress.txt에 이번 시도 기록                 │   │
│     │      │                                                 │   │
│     │      └── iteration += 1                                │   │
│     │          # 다시 시도 (이전 출력이 다음 입력에 포함)    │   │
│     └───────────────────────────────────────────────────────┘   │
│                                                                 │
│  3️⃣ 루프 결과 처리                                              │
│     ├── "TASK_DONE" 발견 → 성공!                               │
│     │   ├── git commit                                         │
│     │   ├── TASKS.md [x] 체크                                  │
│     │   └── 다음 태스크로                                      │
│     │                                                          │
│     └── max_iterations 도달 → 사용자에게 선택 요청             │
│         ├── [1] N회 더 시도                                    │
│         ├── [2] 건너뛰기                                       │
│         └── [3] 중단                                           │
│                                                                 │
│  4️⃣ 학습 기록 (성공 시)                                         │
│     ├── progress.txt에 성공 패턴 기록                          │
│     ├── CLAUDE.md Lessons Learned 업데이트                     │
│     └── orchestrate-state.json 상태 저장                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 반복 루프 (의사코드)

```python
def ralph_loop(task, max_iterations=50, completion_promise="TASK_DONE"):
    """
    공식 Ralph Wiggum 플러그인 방식의 반복 루프
    - 완료 신호가 나올 때까지 끝까지 반복
    - 이전 출력을 다음 입력에 포함 (자기 참조)
    """
    previous_output = ""

    for iteration in range(1, max_iterations + 1):
        # 프롬프트 구성 (이전 출력 포함)
        prompt = f"""
## 태스크: {task.id} - {task.name}

## 이전 학습 (progress.txt)
{read_file(".claude/progress.txt")}

## 이전 시도 결과 (반복 {iteration-1})
{previous_output if previous_output else "(첫 시도)"}

## 완료 조건
- 테스트 통과: pytest tests/ 또는 npm test
- 타입 체크: mypy 또는 tsc --noEmit
- 린트 통과: ruff check 또는 eslint

⚠️ 모든 조건 충족 시에만 "{completion_promise}" 출력
   실패 시 에러를 수정하고 계속 시도하세요.
"""

        # 에이전트 호출
        output = Task(
            subagent_type=task.specialist,
            description=f"[{iteration}/{max_iterations}] {task.id}",
            prompt=prompt
        )

        # 완료 신호 확인
        if completion_promise in output:
            # 성공!
            update_tasks_md(task.id, checked=True)
            update_state(task.id, status="completed", iterations=iteration)
            append_progress(f"✅ {task.id} 완료 ({iteration}회 시도)")
            return True

        # 실패 - 다음 반복을 위해 출력 저장
        previous_output = output
        append_progress(f"🔄 {task.id} 시도 {iteration}: {extract_error(output)}")

    # max_iterations 도달
    return ask_user_continue(task, max_iterations)
```

---

## progress.txt (학습 전달)

> **핵심**: 각 반복은 새 컨텍스트지만, progress.txt로 이전 학습을 전달

**파일 위치**: `.claude/progress.txt`

**형식**:
```
# RALPH Progress Log

## 2026-01-18 10:30 - T0.1 완료
- SQLAlchemy async 세션에서 expire_on_commit=False 필수
- Alembic 마이그레이션 후 서버 재시작 필요

## 2026-01-18 11:15 - T1.1 완료
- JWT 토큰은 HttpOnly 쿠키로 저장
- Refresh 토큰 로직에서 race condition 주의

## 2026-01-18 12:00 - T1.2 실패 (3회 시도)
- 원인: Stripe API 키 미설정
- 해결 필요: .env에 STRIPE_SECRET_KEY 추가
```

---

## CLI 옵션

```bash
/auto-orchestrate --ralph [옵션]

옵션:
  --max-iterations N      최대 반복 횟수 (기본값: 50)
  --completion-promise T  완료 신호 텍스트 (기본값: "TASK_DONE")
```

**예시:**
```bash
# 기본 (50회 반복, TASK_DONE 완료 신호)
/auto-orchestrate --ralph

# 커스텀 설정
/auto-orchestrate --ralph --max-iterations 30 --completion-promise "COMPLETE"

# 끈기 있게 100회까지
/auto-orchestrate --ralph --max-iterations 100
```

---

## 완료 신호 (completion-promise)

에이전트는 태스크가 **진짜로 완료**되었을 때만 완료 신호를 출력:

```
완료 조건 (모두 충족 시에만 "TASK_DONE" 출력):
1. 테스트 통과: pytest tests/ 또는 npm test
2. 타입 체크 통과: mypy 또는 tsc --noEmit
3. 린트 통과: ruff check 또는 eslint

⚠️ 위 조건 중 하나라도 실패하면 "TASK_DONE"을 출력하지 마세요.
   대신 에러를 수정하고 다시 시도하세요.

✅ 모두 통과했을 때만: TASK_DONE
```

---

## 에러 처리

| 조건 | 행동 |
|------|------|
| **에러 발생** | progress.txt에 기록 + **계속 반복** |
| **동일 에러 반복** | 이전 출력을 다음 입력에 포함 → AI가 다른 접근 |
| **max_iterations 도달** | 사용자에게 선택 요청 |
| **의존성 미완료** | 선행 태스크 먼저 완료 시도 |

**반복이 효과적인 이유:**
```
반복 1: 테스트 실패 → 에러 메시지 확인
반복 2: 수정 시도 → 다른 에러 발생
반복 3: 두 에러 모두 수정 → 타입 에러 발생
반복 4: 타입 수정 → 린트 에러 발생
반복 5: 린트 수정 → 모든 검증 통과 → "TASK_DONE" 🎉

→ 5회만에 완료! (이전 방식이면 3회에서 건너뛰기)
```

---

## RALPH vs 일반 모드

| 항목 | RALPH 모드 | 일반 모드 |
|------|-----------|----------|
| **최대 반복** | 50회 | 3회 후 건너뛰기 |
| **완료 판정** | TASK_DONE 출력 시 | 에러 없으면 완료 |
| **실패 처리** | 끝까지 반복 | 건너뛰기 |
| **이전 출력 참조** | ✅ | ❌ |
| **완료율** | 높음 | 중간 |
| **권장 상황** | 복잡한 태스크 | 단순한 태스크 |

---

## 상태 파일 구조

```
프로젝트/
├── .claude/
│   ├── orchestrate-state.json  ← 완료/실패 태스크, 현재 위치
│   ├── progress.txt            ← 반복 간 학습 전달 (핵심!)
│   └── goals/progress.md
├── CLAUDE.md                    ← Lessons Learned (영구 기록)
└── docs/planning/TASKS.md       ← [x] 체크박스로 완료 표시
```

---

## 활성화 조건

- `/auto-orchestrate --ralph` 실행 시
- 복잡한 태스크에서 반복 실패 시 자동 전환
- 동일 에러 3회 이상 발생 시 권장
