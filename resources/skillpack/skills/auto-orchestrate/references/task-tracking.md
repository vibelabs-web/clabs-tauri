# 태스크 누락 방지 시스템

## Claude Code vs LangGraph/CrewAI 비교

```
┌─────────────────────────────────────────────────────────────────┐
│                    상태 관리 비교                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LangGraph/CrewAI:                                             │
│  ├── 외부 상태 저장소 (Redis, PostgreSQL)                      │
│  ├── 프로세스 재시작해도 상태 100% 유지                        │
│  ├── 무제한 태스크 처리 가능                                   │
│  └── 컨텍스트 윈도우 제한 없음                                 │
│                                                                 │
│  Claude Code (기본):                                           │
│  ├── 대화 컨텍스트에 의존                                      │
│  ├── 50개+ 태스크 시 초기 태스크 "잊음" 가능                   │
│  ├── 세션 종료 시 컨텍스트 손실                                │
│  └── ⚠️ 100개 태스크 한번에 실행 → 누락 위험                  │
│                                                                 │
│  Claude Code + Phase Checkpoint (이 시스템):                   │
│  ├── orchestrate-state.json으로 영구 저장                      │
│  ├── Phase 단위 체크포인트 + 컴팩팅                            │
│  ├── CLAUDE.md에 진행 상황 기록                                │
│  ├── --verify로 누락 검증                                      │
│  └── ✅ LangGraph/CrewAI 수준의 안정성 확보                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 누락 방지 메커니즘

### 1. 태스크 완료 즉시 상태 저장

```
태스크 T2.5 완료
    ↓
즉시 orchestrate-state.json 업데이트:
{
  "completed_tasks": [..., "T2.5"],
  "phases": {
    "2": {
      "completed_tasks": 5,
      "next_task": "T2.6"
    }
  }
}
```

### 2. Phase 완료 시 강제 체크포인트

```
Phase N 완료
    ↓
1️⃣ 상태 저장 (orchestrate-state.json)
2️⃣ CLAUDE.md 업데이트
3️⃣ 슬랙 알림
4️⃣ AskUserQuestion 체크포인트
    ↓
⛔ 이 4단계 없이 다음 Phase 진행 금지!
```

### 3. 이중 검증 (TASKS.md + state.json)

```
태스크 실행 전:
    ↓
1️⃣ TASKS.md에서 체크박스 확인
    [ ] T2.5: 장바구니 API → 미완료
    [x] T2.4: 상품 API → 완료
    ↓
2️⃣ orchestrate-state.json 확인
    completed_tasks에 T2.5 없음 → 미완료
    ↓
3️⃣ 둘 다 미완료로 확인 → 실행
```

### 4. --verify로 최종 검증

```bash
/auto-orchestrate --verify
```

누락된 태스크가 있으면 보고서에 표시.

---

## 권장 실행 패턴

### 소규모 (< 30 태스크)

```
/auto-orchestrate
→ 전체 자동 실행 (체크포인트 선택적)
```

### 중규모 (30-50 태스크)

```
/auto-orchestrate --phase 0
→ Phase 0 완료
/compact
/auto-orchestrate --phase 1
→ Phase 1 완료
/compact
...
```

### 대규모 (50+ 태스크)

```
/auto-orchestrate --phase 0
→ Phase 0 완료
/compact
/auto-orchestrate --resume
→ Phase 1 완료 시 자동 체크포인트
→ [/compact 후 계속] 선택
/compact
/auto-orchestrate --resume
→ 반복
```

---

## 누락 발생 시 복구

```
누락 감지 (--verify 또는 수동 확인)
    ↓
1️⃣ 누락된 태스크 ID 확인
    예: T2.7, T2.9
    ↓
2️⃣ TASKS.md에서 체크박스 확인
    [ ] T2.7: 장바구니 수량 변경
    [ ] T2.9: 장바구니 삭제
    ↓
3️⃣ 해당 Phase 재실행
    /auto-orchestrate --phase 2 --resume
    ↓
4️⃣ 누락된 태스크만 실행됨
```

---

## 상태 파일 백업

대규모 프로젝트에서는 상태 파일을 Git에 커밋하는 것을 권장:

```bash
# Phase 완료 시마다
git add .claude/orchestrate-state.json CLAUDE.md
git commit -m "checkpoint: Phase N 완료"
```
