---
name: auto-orchestrate
description: TASKS.md를 분석하여 의존성 기반 자동 직렬/병렬 실행. Phase 병합까지 완전 자동화.
trigger: /orchestrate에서 "완전 자동화" 선택 시 내부 호출
---

# Auto-Orchestrate: 완전 자동화 오케스트레이션

> **TASKS.md의 모든 태스크를 의존성 분석 기반으로 자동 실행**
> Phase 병합, 테스트, 빌드까지 모두 자동화

---

## 실행 전 필수 체크리스트

```
┌─────────────────────────────────────────────────────────────────┐
│  /auto-orchestrate 시작 시 반드시 다음을 먼저 수행하세요!        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ 슬랙 웹훅 URL 확인                                          │
│     └── .claude/orchestrate-state.json에서 확인                 │
│     └── 없으면 → AskUserQuestion으로 요청!                      │
│                                                                 │
│  2️⃣ CLAUDE.md 존재 확인                                         │
│     └── 없으면 → 기본 템플릿으로 생성                           │
│                                                                 │
│  3️⃣ Git Worktree 확인 (Phase별 필수!)                           │
│     └── TASKS.md에서 Worktree 경로 확인                         │
│     └── 없으면 → 생성 후 해당 디렉토리에서 작업                 │
│                                                                 │
│  ⛔ 이 체크리스트를 건너뛰고 태스크 실행 시작 금지!              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 핵심 원칙

```
┌─────────────────────────────────────────────────────────────────┐
│  1. TASKS.md 파싱 → 의존성 그래프 구축                           │
│  2. 의존성 없는 태스크 → 병렬 실행 (Task 도구 동시 호출)         │
│  3. 의존성 있는 태스크 → 선행 완료 대기 후 직렬 실행             │
│  4. Phase 완료 → 테스트/빌드 확인 → main 자동 병합              │
│  5. 실패해도 멈추지 않음 → 최종 보고에서 실패 목록 표시          │
│  6. [필수!] Phase 완료 시 슬랙 알림 + 컴팩팅 안내                │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⛔ 강제 금지 규칙 (ABSOLUTE PROHIBITION)

```
┌─────────────────────────────────────────────────────────────────┐
│  🚫 메인 에이전트(오케스트레이터)는 절대 직접 코드 작성 금지!    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ 금지 행동:                                                   │
│  ├── Write/Edit 도구로 소스 코드 직접 작성                      │
│  ├── 테스트 파일 직접 작성                                      │
│  ├── 구현 파일 직접 수정                                        │
│  └── "내가 직접 구현하겠다"는 판단                              │
│                                                                 │
│  ✅ 필수 행동:                                                   │
│  ├── TASKS.md의 "담당" 필드 확인                                │
│  ├── 해당 전문가 에이전트를 Task 도구로 호출                    │
│  ├── 전문가 에이전트의 결과 대기                                │
│  └── 결과에 따라 다음 태스크 진행                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 허용되는 오케스트레이터 직접 작업

| 작업 | 허용 | 이유 |
|------|-----|------|
| TASKS.md 체크박스 업데이트 | ✅ | 진행 상황 관리 |
| CLAUDE.md 업데이트 | ✅ | 학습 내용 기록 |
| Git 명령어 실행 | ✅ | 병합, Worktree 관리 |
| 테스트/빌드 명령어 실행 | ✅ | 품질 게이트 검증 |
| 소스 코드 작성/수정 | ⛔ | 전문가 에이전트 담당 |
| 테스트 코드 작성/수정 | ⛔ | 전문가 에이전트 담당 |

---

## 워크플로우 요약

```
1단계: TASKS.md 파싱 + 의존성 분석
    ↓
2단계: Git Worktree 설정 (⚠️ 필수!)
    ├── TASKS.md에서 Phase별 Worktree 경로 확인
    ├── 없으면 → git worktree add 명령으로 생성
    └── 해당 Worktree 디렉토리로 이동
    ↓
3단계: 실행 큐 생성 (병렬 가능한 태스크 그룹화)
    ↓
4단계: 자동 실행 (Worktree 내에서!)
    ├── Task 도구로 전문가 에이전트 호출
    ├── 프론트엔드 → 스크린샷 검증
    └── 동일 에러 3회 → systematic-debugging
    ↓
5단계: Phase 완료 처리
    ├── 품질 게이트 (테스트, 커버리지, 보안)
    ├── main 병합 (Worktree에서 main으로)
    └── 슬랙 알림 + 체크포인트
    ↓
6단계: 다음 Phase 또는 완료
```

---

## ⚠️ Git Worktree 필수 규칙 (MANDATORY)

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨 모든 Phase 작업은 반드시 Git Worktree에서 수행!             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ 금지: main 브랜치에서 직접 코드 작성                        │
│  ✅ 필수: Phase별 Worktree 생성 후 해당 디렉토리에서 작업       │
│                                                                 │
│  이 규칙을 무시하면 Phase 병합 시 충돌 발생!                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Worktree 설정 절차

```bash
# 1. TASKS.md에서 Worktree 경로 확인
# 예: Worktree: worktree/phase-1-object-system

# 2. Worktree 존재 여부 확인
git worktree list

# 3. 없으면 생성
git worktree add worktree/phase-1-object-system -b phase-1-object-system

# 4. Worktree 디렉토리로 이동
cd worktree/phase-1-object-system

# 5. 이 디렉토리에서 모든 태스크 수행!
```

### 전문가 에이전트 호출 시 Worktree 경로 전달

```
Task({
  subagent_type: "frontend-specialist",
  description: "P1-T1.4: 객체 스토어 구현",
  prompt: """
## 태스크 정보
- **Phase**: 1
- **태스크 ID**: P1-T1.4
- **Worktree**: worktree/phase-1-object-system  ← 반드시 명시!

⚠️ 모든 파일 작업은 worktree/phase-1-object-system 디렉토리에서 수행하세요.
메인 프로젝트 루트가 아닌 Worktree 경로를 사용해야 합니다.

...
"""
})
```

### Phase 완료 후 병합

```bash
# 1. Worktree에서 테스트 통과 확인
cd worktree/phase-1-object-system
npm test

# 2. main으로 돌아가기
cd ../..

# 3. 병합
git merge phase-1-object-system --no-ff -m "Phase 1: Object System 완료"

# 4. Worktree 정리 (선택)
git worktree remove worktree/phase-1-object-system
```

---

## 전문가 에이전트 호출

| subagent_type | 역할 |
|---------------|------|
| `backend-specialist` | API, 비즈니스 로직, DB 연동 |
| `frontend-specialist` | React UI, 상태관리, API 통합 |
| `database-specialist` | 스키마, 마이그레이션 |
| `test-specialist` | 테스트 작성, 품질 검증 |
| `security-specialist` | 보안 검사, 취약점 분석 |
| `3d-engine-specialist` | Three.js, IFC/BIM, 3D 시각화 |

**호출 형식:**

```
Task({
  subagent_type: "backend-specialist",  ← TASKS.md의 "담당" 값
  description: "P1-T1.1: 거래 API 구현",
  prompt: "Phase 1, T1.1 작업을 수행합니다. ..."
})
```

---

## Phase 완료 시 필수 행동

### 일반 모드 (기본)

```
Phase N 완료
    ↓
1️⃣ 슬랙 알림 전송 (웹훅 URL 있는 경우)
    "🎉 Phase N 완료! (X개 태스크)"
    ↓
2️⃣ AskUserQuestion으로 다음 단계 확인
    ┌─────────────────────────────────────────────────┐
    │ ✅ Phase N 완료!                                 │
    │                                                  │
    │ [1] /compact 후 계속 (권장)                      │
    │ [2] 바로 다음 Phase 시작                         │
    │ [3] 여기서 종료                                  │
    └─────────────────────────────────────────────────┘

⛔ 일반 모드에서는 이 두 단계를 건너뛰고 바로 다음 Phase로 진행 금지!
```

### 🚨 Ultra-Thin 모드 (`--ultra-thin`) 예외!

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ --ultra-thin 모드에서는 위 규칙이 적용되지 않습니다!        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Ultra-Thin Phase 완료 시:                                      │
│    1️⃣ 슬랙 알림 전송 (비동기)                                   │
│    2️⃣ 자동 병합                                                 │
│    3️⃣ ❌ AskUserQuestion 없음!                                  │
│    4️⃣ 즉시 다음 Phase 시작                                      │
│                                                                 │
│  Ultra-Thin 모드는 ALL_DONE까지 절대 멈추지 않습니다!           │
│  상세: ../ultra-thin-orchestrate/SKILL.md                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## CLI 옵션 요약

| 옵션 | 설명 |
|------|------|
| `/auto-orchestrate` | 전체 자동 실행 |
| `--phase N` | 특정 Phase만 실행 |
| `--resume` | 중단된 작업 재개 |
| `--ralph` | RALPH 루프 모드 (50회 반복) |
| `--verify` | 태스크 누락 검증 |
| `--ultra-thin` | **Ultra-Thin 모드** (200개 태스크까지 지원) |

> 상세 내용: `references/cli-options.md`

---

## Ultra-Thin 모드 (`--ultra-thin`)

> **50-200개 태스크 프로젝트에 권장!**
> 메인 에이전트 컨텍스트를 76% 절감하여 오토 컴팩팅 없이 대규모 실행

### 언제 사용하나요?

| Task 수 | 권장 모드 | 명령어 |
|---------|----------|--------|
| 1-30개 | 일반 모드 | `/auto-orchestrate` |
| 30-50개 | 일반 + 컴팩팅 | `/auto-orchestrate` + Phase별 `/compact` |
| **50-200개** | **Ultra-Thin** | `/auto-orchestrate --ultra-thin` |
| 200개+ | Ultra-Thin + 분할 | `--ultra-thin --phase N` |

### Ultra-Thin 핵심 원리

```
┌─────────────────────────────────────────────────────────────────┐
│  일반 모드: 메인이 모든 걸 직접 처리 → 컨텍스트 폭발            │
│  Ultra-Thin: 메인은 교통정리만 → 서브가 모든 걸 처리            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ TASKS.md 직접 파싱 금지 (dependency-resolver가 함)          │
│  ❌ 상세 프롬프트 작성 금지 (Task ID만 전달)                    │
│  ❌ 결과 분석 금지 (task-executor가 함)                         │
│                                                                 │
│  ✅ Task ID만 전달: "TASK_ID:T1.3"                              │
│  ✅ 한 줄 결과만 수신: "DONE:T1.3"                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 토큰 절감 효과

| 항목 | 일반 모드 (50 Task) | Ultra-Thin (200 Task) |
|------|---------------------|----------------------|
| 총 컨텍스트 | ~160K 토큰 | ~38K 토큰 |
| Task당 평균 | ~3,200 토큰 | ~190 토큰 |
| **절감율** | - | **76%** |

### 전용 서브에이전트

| 에이전트 | 역할 |
|----------|------|
| `dependency-resolver` | TASKS.md 파싱, 의존성 분석, 실행 가능 Task 계산 |
| `task-executor` | 개별 Task 자율 수행, 전문가 에이전트 내부 호출 |

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

> 상세 내용: `../ultra-thin-orchestrate/SKILL.md`

---

## 프론트엔드 데모 검증 (필수!)

프론트엔드 태스크 완료 시:

```
1️⃣ 데모 페이지 존재 확인
    └── 없으면 → 생성 요청
    ↓
2️⃣ 상태별 스크린샷 검증
    loading, error, empty, normal
    ↓
3️⃣ 콘솔 에러 확인
    ↓
4️⃣ 테스트 가이드 출력 (TASK_DONE 전 필수!)
```

### 테스트 가이드 출력 형식

```
## ✅ P1-T1.2: 거래 목록 컴포넌트 구현 완료!

### 📍 데모 페이지
URL: http://localhost:3000/demo/phase-1/t1-2-transaction-list

### 🧪 테스트 방법
1. 개발 서버 실행: `npm run dev`
2. 위 URL 접속
3. 각 상태 버튼 클릭하여 UI 확인:
   - [Loading] 로딩 스피너 표시
   - [Error] 에러 메시지 표시
   - [Empty] 빈 상태 안내
   - [Normal] 거래 목록 표시

TASK_DONE
```

---

## 참조 문서

| 문서 | 내용 |
|------|------|
| `references/cli-options.md` | CLI 옵션 상세 |
| `references/checkpoint-system.md` | Phase 체크포인트 시스템 |
| `references/slack-setup.md` | 슬랙 웹훅 설정 |
| `references/task-tracking.md` | 태스크 누락 방지 |
| `references/dependency-parser.md` | 의존성 파싱 상세 |
| `../ralph-loop/SKILL.md` | RALPH 루프 패턴 (독립 스킬) |

---

## 에러 발생 시 CLAUDE.md 기록 (필수!)

태스크 실패 시 반드시 CLAUDE.md에 기록:

```markdown
## 실패한 태스크

| 태스크 | 에러 | 시도 | 상태 |
|--------|------|------|------|
| T1.3 | TypeError: undefined | 10회 | 건너뜀 |

## Lessons Learned

### [2026-01-18] T1.3 실패 - TypeError
- **원인**: API 응답 형식 변경
- **해결**: response.data?.items 옵셔널 체이닝 추가
- **교훈**: API 응답은 항상 방어적으로 처리
```

---

## 활성화 조건

- `/orchestrate`에서 "완전 자동화" 선택 시
- `/auto-orchestrate` 직접 실행 시
- `--resume` 옵션으로 재개 시

---

## 제한사항

- 대화 컨텍스트 제한으로 **50개 이상 태스크** 시 Phase별 `/compact` 권장
- 외부 API 키 필요 시 사용자 입력 대기
- 보안 검사에서 CRITICAL 발견 시 자동 중단

---

## 상태 파일

```
.claude/
├── orchestrate-state.json  ← 진행 상황, 슬랙 URL
├── progress.txt            ← RALPH 학습 기록
└── goals/progress.md       ← 목표 진행률
```

---

## 완료 보고 예시

```
═══════════════════════════════════════════════════════
  🎉 Auto-Orchestrate 완료!
═══════════════════════════════════════════════════════

📊 결과 요약:
   총 태스크: 45개
   성공: 43개 (96%)
   실패: 2개

❌ 실패 태스크:
   - T2.5: Redis 연결 실패 (10회 시도)
   - T3.2: Stripe API 키 필요

📋 권장 조치:
   1. Redis 서버 상태 확인
   2. .env에 STRIPE_SECRET_KEY 추가 후:
      /auto-orchestrate --phase 2 --resume

═══════════════════════════════════════════════════════
```
