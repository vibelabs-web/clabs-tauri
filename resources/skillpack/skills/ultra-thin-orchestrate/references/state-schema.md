# Ultra-Thin Orchestrate 상태 파일 스키마

> **상태 파일 경로**: `.claude/orchestrate-state.json`
> Ultra-Thin 모드의 핵심 - 모든 진행 상황이 이 파일로 관리됨

---

## 전체 스키마

```json
{
  "version": "2.0",
  "mode": "ultra-thin",
  "project": "project-name",

  "execution": {
    "current_phase": 1,
    "worktree": "worktree/phase-1-feature-name",
    "started_at": "2026-01-21T09:00:00Z",
    "last_updated": "2026-01-21T10:30:00Z"
  },

  "tasks": {
    "pending": ["T1.5", "T1.6", "T1.7"],
    "ready": ["T1.3", "T1.4"],
    "in_progress": ["T1.3"],
    "completed": ["T0.5.1", "T1.1", "T1.2"],
    "failed": [],
    "blocked": []
  },

  "dependencies": {
    "T1.3": ["T1.1", "T1.2"],
    "T1.4": ["T1.1"],
    "T1.5": ["T1.3", "T1.4"],
    "T1.6": ["T1.3"],
    "T1.7": ["T1.5", "T1.6"]
  },

  "checkpoints": {
    "phase_0": {
      "completed_at": "2026-01-21T09:30:00Z",
      "tasks_count": 3,
      "tasks": ["T0.5.1", "T0.5.2", "T0.5.3"],
      "merged": true,
      "merge_commit": "abc1234"
    },
    "phase_1": {
      "started_at": "2026-01-21T09:35:00Z",
      "progress": "2/6"
    }
  },

  "metrics": {
    "total_tasks": 45,
    "completed_count": 5,
    "failed_count": 0,
    "average_task_time_seconds": 120
  },

  "config": {
    "max_parallel": 0,
    "retry_limit": 10,
    "slack_webhook_url": "https://hooks.slack.com/services/XXX/YYY/ZZZ"
  }
}
```

---

## 필드 상세 설명

### version

```json
"version": "2.0"
```

- **목적**: 스키마 버전 관리
- **값**: "2.0" (Ultra-Thin 전용)
- **호환성**: 1.x는 일반 모드, 2.x는 Ultra-Thin

---

### mode

```json
"mode": "ultra-thin"
```

- **목적**: 오케스트레이션 모드 식별
- **값**: "normal" | "ultra-thin" | "ralph"
- **용도**: 모드에 따른 동작 분기

---

### project

```json
"project": "my-awesome-app"
```

- **목적**: 프로젝트 식별자
- **값**: TASKS.md의 프로젝트명 또는 디렉토리명
- **용도**: 로그, 알림에서 프로젝트 구분

---

### execution

```json
"execution": {
  "current_phase": 1,
  "worktree": "worktree/phase-1-user-auth",
  "started_at": "2026-01-21T09:00:00Z",
  "last_updated": "2026-01-21T10:30:00Z"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `current_phase` | number | 현재 실행 중인 Phase (0부터 시작) |
| `worktree` | string | 현재 Phase의 Git Worktree 경로 |
| `started_at` | ISO8601 | 실행 시작 시각 |
| `last_updated` | ISO8601 | 마지막 상태 업데이트 시각 |

---

### tasks

```json
"tasks": {
  "pending": ["T1.5", "T1.6"],
  "ready": ["T1.3", "T1.4"],
  "in_progress": ["T1.3"],
  "completed": ["T1.1", "T1.2"],
  "failed": [],
  "blocked": []
}
```

#### 상태 정의

| 상태 | 설명 |
|------|------|
| `pending` | 의존성 미해결, 실행 불가 |
| `ready` | 의존성 해결됨, 실행 대기 중 |
| `in_progress` | 현재 실행 중 |
| `completed` | 성공적으로 완료 |
| `failed` | 10회 재시도 후 실패 |
| `blocked` | 의존 Task 실패로 실행 불가 |

#### 상태 전이 다이어그램

```
                    ┌─────────┐
                    │ pending │
                    └────┬────┘
                         │ 의존성 해결
                    ┌────▼────┐
                    │  ready  │
                    └────┬────┘
                         │ 실행 시작
                    ┌────▼────┐
              ┌─────│in_progress│─────┐
              │     └─────────┘       │
              │ 성공               실패│
         ┌────▼────┐          ┌───▼───┐
         │completed│          │failed │
         └─────────┘          └───────┘
                                  │
                                  │ 의존 Task
                             ┌────▼────┐
                             │ blocked │
                             └─────────┘
```

---

### dependencies

```json
"dependencies": {
  "T1.3": ["T1.1", "T1.2"],
  "T1.4": ["T1.1"],
  "T1.5": ["T1.3", "T1.4"]
}
```

- **키**: Task ID
- **값**: 의존하는 Task ID 배열
- **규칙**: 배열의 모든 Task가 completed 상태여야 ready로 전환

#### 의존성 해석 예시

```
T1.3 의존: [T1.1, T1.2]

현재 상태:
- T1.1: completed ✅
- T1.2: completed ✅

→ T1.3: pending → ready (모든 의존성 해결)
```

---

### checkpoints

```json
"checkpoints": {
  "phase_0": {
    "completed_at": "2026-01-21T09:30:00Z",
    "tasks_count": 3,
    "tasks": ["T0.5.1", "T0.5.2", "T0.5.3"],
    "merged": true,
    "merge_commit": "abc1234"
  },
  "phase_1": {
    "started_at": "2026-01-21T09:35:00Z",
    "progress": "2/6"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `completed_at` | ISO8601 | Phase 완료 시각 |
| `started_at` | ISO8601 | Phase 시작 시각 |
| `tasks_count` | number | Phase 내 총 Task 수 |
| `tasks` | string[] | Phase 내 Task ID 목록 |
| `progress` | string | "완료/전체" 형식의 진행률 |
| `merged` | boolean | main 브랜치 병합 여부 |
| `merge_commit` | string | 병합 커밋 해시 (앞 7자리) |

---

### metrics

```json
"metrics": {
  "total_tasks": 45,
  "completed_count": 5,
  "failed_count": 0,
  "average_task_time_seconds": 120
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `total_tasks` | number | TASKS.md의 총 Task 수 |
| `completed_count` | number | 완료된 Task 수 |
| `failed_count` | number | 실패한 Task 수 |
| `average_task_time_seconds` | number | 평균 Task 실행 시간 |

---

### config

```json
"config": {
  "max_parallel": 0,
  "retry_limit": 10,
  "slack_webhook_url": "https://hooks.slack.com/..."
}
```

| 필드 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| `max_parallel` | number | 최대 병렬 실행 수 (0=무제한) | 0 |
| `retry_limit` | number | Task 재시도 횟수 | 10 |
| `slack_webhook_url` | string | 슬랙 웹훅 URL (선택) | null |

---

## 상태 파일 연산

### 초기화

```json
{
  "version": "2.0",
  "mode": "ultra-thin",
  "project": "detected-from-directory",
  "execution": {
    "current_phase": 0,
    "worktree": null,
    "started_at": "now",
    "last_updated": "now"
  },
  "tasks": {
    "pending": ["all-tasks-from-TASKS.md"],
    "ready": [],
    "in_progress": [],
    "completed": [],
    "failed": [],
    "blocked": []
  },
  "dependencies": {},
  "checkpoints": {},
  "metrics": {
    "total_tasks": 0,
    "completed_count": 0,
    "failed_count": 0,
    "average_task_time_seconds": 0
  },
  "config": {
    "max_parallel": 0,
    "retry_limit": 10,
    "slack_webhook_url": null
  }
}
```

### Task 시작 시

```javascript
// T1.3 실행 시작
tasks.ready.remove("T1.3")
tasks.in_progress.push("T1.3")
execution.last_updated = now()
```

### Task 완료 시

```javascript
// T1.3 완료
tasks.in_progress.remove("T1.3")
tasks.completed.push("T1.3")
metrics.completed_count++
execution.last_updated = now()

// 의존성 업데이트 (dependency-resolver가 처리)
// T1.5가 T1.3에 의존하고, T1.4도 완료 상태면
// tasks.pending.remove("T1.5")
// tasks.ready.push("T1.5")
```

### Task 실패 시

```javascript
// T1.3 실패 (10회 재시도 후)
tasks.in_progress.remove("T1.3")
tasks.failed.push("T1.3")
metrics.failed_count++

// T1.3에 의존하는 Task들을 blocked로
for (task in tasks.pending) {
  if (dependencies[task].includes("T1.3")) {
    tasks.pending.remove(task)
    tasks.blocked.push(task)
  }
}
```

### Phase 완료 시

```javascript
// Phase 1 완료
checkpoints.phase_1.completed_at = now()
checkpoints.phase_1.tasks_count = count
checkpoints.phase_1.merged = true
checkpoints.phase_1.merge_commit = "abc1234"

execution.current_phase = 2
execution.worktree = "worktree/phase-2-feature"
```

---

## 파일 잠금

동시 접근 방지를 위한 잠금:

```
.claude/orchestrate-state.json.lock
```

```javascript
// 잠금 획득
while (exists(".claude/orchestrate-state.json.lock")) {
  wait(100ms)
}
create(".claude/orchestrate-state.json.lock")

// 작업 수행
update_state()

// 잠금 해제
delete(".claude/orchestrate-state.json.lock")
```

---

## 복구 시나리오

### 중단 후 재개

```bash
/auto-orchestrate --ultra-thin --resume
```

1. orchestrate-state.json 로드
2. in_progress Task를 ready로 복귀
3. 실행 재개

### 상태 파일 손상

```bash
# 백업에서 복구
cp .claude/orchestrate-state.json.bak .claude/orchestrate-state.json

# 또는 TASKS.md에서 재생성
/auto-orchestrate --ultra-thin --rebuild-state
```

### 수동 상태 수정

```bash
# 특정 Task 강제 완료 처리
jq '.tasks.failed -= ["T1.3"] | .tasks.completed += ["T1.3"]' \
  .claude/orchestrate-state.json > tmp.json && \
  mv tmp.json .claude/orchestrate-state.json
```
