---
name: evaluation
description: Phase 완료 후 품질 게이트 검사, 메트릭 측정, 리포트 생성. auto-orchestrate와 연동.
trigger: Phase 완료 시 자동 호출 또는 /evaluate 명령어
---

# Evaluation & Monitoring 스킬

> **Agentic Design Pattern #16**: 에이전트 출력과 시스템 성능을 정량적으로 측정하고 모니터링

## 개요

코드 품질, 에이전트 성능, 비용을 정량적으로 측정하여 지속적인 개선을 지원합니다.

## 핵심 원칙

```
┌─────────────────────────────────────────────────────────────┐
│  Evaluation Loop                                            │
│                                                             │
│  실행 → 측정 → 분석 → 개선 → 실행 ...                        │
│                                                             │
│  측정 대상:                                                  │
│  ├── 코드 품질 (복잡도, 커버리지, 보안)                      │
│  ├── 에이전트 성능 (응답 시간, 재시도 횟수, 성공률)          │
│  └── 비용 효율 (토큰 사용량, API 호출 수)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 측정 메트릭

### 1. 코드 품질 메트릭

| 메트릭 | 측정 방법 | 기준값 | 경고 임계값 |
|--------|----------|--------|------------|
| **테스트 커버리지** | pytest --cov / vitest --coverage | ≥70% | <60% |
| **복잡도 (Cyclomatic)** | radon cc / eslint complexity | ≤10 | >15 |
| **코드 중복** | jscpd / pylint duplicate | ≤5% | >10% |
| **린트 에러** | ruff / eslint | 0 | >5 |
| **타입 에러** | mypy / tsc | 0 | >0 |
| **보안 점수** | bandit / npm audit | 0 critical | any critical |

### 2. 에이전트 성능 메트릭

| 메트릭 | 설명 | 기준값 |
|--------|------|--------|
| **태스크 완료율** | 성공한 태스크 / 전체 태스크 | ≥95% |
| **평균 재시도 횟수** | 태스크당 재시도 평균 | ≤2회 |
| **첫 시도 성공률** | 재시도 없이 성공한 비율 | ≥80% |
| **에러 복구율** | 에러 후 복구 성공 비율 | ≥90% |

### 3. 비용 메트릭

| 메트릭 | 측정 | 최적화 방향 |
|--------|------|------------|
| **토큰 사용량** | 입력 + 출력 토큰 | 최소화 |
| **API 호출 수** | 총 도구 호출 횟수 | 배치 처리로 감소 |
| **Phase당 비용** | Phase별 토큰 사용 | Phase 0 최소화 |

---

## 📁 메트릭 저장 구조

```
.claude/metrics/
├── quality/
│   ├── coverage.json      # 테스트 커버리지 이력
│   ├── complexity.json    # 복잡도 이력
│   └── security.json      # 보안 점수 이력
├── performance/
│   ├── tasks.json         # 태스크 완료 기록
│   └── agents.json        # 에이전트별 성능
├── cost/
│   └── tokens.json        # 토큰 사용량 이력
└── reports/
    └── YYYY-MM-DD.md      # 일간 리포트
```

---

## 🔄 평가 워크플로우

### Phase 완료 시 자동 평가

```bash
# 1. 코드 품질 측정
pytest --cov=app --cov-report=json > .claude/metrics/quality/coverage.json
ruff check . --statistics > .claude/metrics/quality/lint.json

# 2. 결과 분석
# - 기준값 대비 비교
# - 이전 Phase 대비 변화 추적
# - 경고 임계값 초과 시 알림

# 3. 리포트 생성
# .claude/metrics/reports/YYYY-MM-DD.md 에 기록
```

### 평가 리포트 템플릿

```markdown
# Phase X 평가 리포트

## 📊 코드 품질
| 메트릭 | 값 | 기준 | 상태 |
|--------|-----|------|------|
| 테스트 커버리지 | 75% | ≥70% | ✅ |
| 복잡도 | 8 | ≤10 | ✅ |
| 린트 에러 | 0 | 0 | ✅ |

## 🤖 에이전트 성능
| 메트릭 | 값 | 기준 | 상태 |
|--------|-----|------|------|
| 태스크 완료율 | 100% | ≥95% | ✅ |
| 평균 재시도 | 1.2회 | ≤2회 | ✅ |

## 💰 비용
- 총 토큰: 45,000
- Phase 0: 15,000 (33%)
- Phase 1: 30,000 (67%)

## 🎯 개선 권장사항
1. auth_service.py 복잡도 12 → 리팩토링 권장
2. tests/api/ 커버리지 65% → 테스트 추가 필요
```

---

## 🚦 품질 게이트

### Phase 병합 조건

```yaml
quality_gates:
  # 필수 통과 (실패 시 병합 불가)
  required:
    - test_coverage: ">= 70%"
    - lint_errors: "== 0"
    - type_errors: "== 0"
    - security_critical: "== 0"

  # 권장 (경고만 표시)
  recommended:
    - test_coverage: ">= 85%"
    - complexity: "<= 10"
    - duplication: "<= 5%"
```

### 게이트 검사 스크립트

```bash
#!/bin/bash
# .claude/scripts/quality-gate.sh

echo "🔍 품질 게이트 검사 중..."

# 1. 테스트 커버리지
COVERAGE=$(pytest --cov=app --cov-report=term | grep TOTAL | awk '{print $4}' | tr -d '%')
if [ "$COVERAGE" -lt 70 ]; then
  echo "❌ 커버리지 실패: ${COVERAGE}% (최소 70%)"
  exit 1
fi

# 2. 린트 에러
LINT_ERRORS=$(ruff check . --statistics 2>&1 | tail -1 | grep -oP '\d+(?= errors)')
if [ "$LINT_ERRORS" -gt 0 ]; then
  echo "❌ 린트 에러: ${LINT_ERRORS}개"
  exit 1
fi

# 3. 타입 에러
TYPE_ERRORS=$(mypy . --no-error-summary 2>&1 | grep -c "error:")
if [ "$TYPE_ERRORS" -gt 0 ]; then
  echo "❌ 타입 에러: ${TYPE_ERRORS}개"
  exit 1
fi

echo "✅ 모든 품질 게이트 통과!"
```

---

## 📈 트렌드 분석

### 메트릭 시계열 데이터

```json
// .claude/metrics/quality/coverage.json
{
  "history": [
    {"date": "2025-01-15", "phase": "1", "value": 65},
    {"date": "2025-01-16", "phase": "2", "value": 72},
    {"date": "2025-01-17", "phase": "3", "value": 78}
  ],
  "trend": "improving",
  "average": 71.67
}
```

### 트렌드 시각화 (ASCII)

```
커버리지 트렌드 (최근 5 Phase)
100% |
 90% |
 80% |       ▄▄ ██
 70% |    ▄▄ ██ ██ ← 목표선
 60% | ▄▄ ██ ██ ██
 50% | ██ ██ ██ ██
     +--+--+--+--+--
       P1 P2 P3 P4
```

---

## 🔗 에이전트 연동

### Orchestrator에서 호출

```markdown
## Phase 완료 시 평가 실행

Phase 구현 완료 후 병합 전에 반드시 평가를 실행합니다:

1. **품질 게이트 검사**
   - 커버리지, 린트, 타입 체크 실행
   - 실패 시 구현 에이전트에게 수정 요청

2. **메트릭 기록**
   - .claude/metrics/에 결과 저장
   - 이전 Phase와 비교

3. **리포트 생성**
   - .claude/metrics/reports/에 일간 리포트 저장
```

### test-specialist 연동

```markdown
## 테스트 커버리지 강제

테스트 실행 시 항상 커버리지 측정:

```bash
# Backend
pytest --cov=app --cov-fail-under=70 --cov-report=json

# Frontend
vitest run --coverage --coverage.thresholds.lines=70
```

커버리지 미달 시:
1. 부족한 파일/함수 식별
2. 추가 테스트 작성
3. 재측정 후 게이트 통과
```

---

## 🎯 사용 시나리오

### 시나리오 1: Phase 완료 평가

```
오케스트레이터: "Phase 1 완료. 평가 실행."

평가 결과:
✅ 커버리지: 75% (기준 70%)
✅ 린트: 0 에러
❌ 복잡도: user_service.py = 15 (기준 10)

권장: user_service.py 리팩토링 후 병합
```

### 시나리오 2: 성능 저하 감지

```
트렌드 분석:
⚠️ 평균 재시도 횟수 증가 추세
  - Phase 1: 1.0회
  - Phase 2: 1.5회
  - Phase 3: 2.3회 ← 경고

원인 분석:
- 테스트 불안정 (flaky tests)
- 명세 모호함

권장: 테스트 안정화 및 명세 명확화
```

---

## 📝 Memory 연동

평가 결과 중 중요한 학습 내용을 `.claude/memory/learnings.md`에 기록:

```markdown
## 2025-01-17 학습

### 품질 관련
- user_service.py 복잡도 15 → extract_method로 8로 감소
- 조건문 중첩 3단계 이상은 early return으로 개선

### 성능 관련
- pytest 병렬 실행 시 DB 충돌 → transaction isolation 필요
```

---

## 📋 Goal-Setting 연동

평가 완료 후 Goal-Setting 진행 상황을 자동 업데이트:

```markdown
## Phase 완료 평가 → Goal-Setting 업데이트

### 업데이트 대상 파일
- .claude/goals/progress.md: Phase 진행률 갱신
- .claude/goals/blockers.md: 의존성 해소된 Task 표시
- .claude/goals/timeline.md: 예상 완료일 조정

### 자동 업데이트 내용
1. Phase 진행률 = (완료 Task / 전체 Task) × 100%
2. 품질 게이트 통과 여부 기록
3. 다음 Phase 시작 가능 여부 판정
4. 일정 지연 감지 시 경고 플래그

### 예시
평가 결과:
- Phase 2: 100% 완료, 품질 게이트 통과

Goal-Setting 업데이트:
- progress.md: Phase 2 ✅ 완료
- blockers.md: T3.1, T3.2 시작 가능
- timeline.md: 예정대로 진행 중
```

---

## 활성화 조건

다음 상황에서 자동 활성화:
- Phase 완료 후 main 병합 전
- `/evaluate` 명령어 실행 시
- 품질 저하 감지 시 (CI/CD 연동)

---

## 참조 파일

- `references/metrics-schema.md` - 메트릭 JSON 스키마
- `references/quality-gates.md` - 품질 게이트 상세 설정
