---
name: trinity
description: 五柱(眞善美孝永) 철학 기반 코드 품질 평가. Trinity Score로 정량화된 코드 품질 점수 제공. 4-Gate CI Protocol 통합.
trigger: /trinity, Phase 완료 시, PR 생성 전
integrates_with: [evaluation, code-review, auto-orchestrate]
inspired_by: HyoDo (https://github.com/lofibrainwav/HyoDo)
---

# Trinity - 五柱 코드 품질 평가

> **"眞善美孝永 - 진리, 선함, 아름다움, 고요함, 영원함으로 코드를 평가한다"**

## 개요

Trinity는 HyoDo의 五柱 철학을 Claude Labs에 통합한 코드 품질 평가 시스템입니다.
단순한 메트릭 측정을 넘어, **철학적 관점**에서 코드의 본질적 품질을 평가합니다.

---

## 五柱 (The Five Pillars)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Trinity Score 계산                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   眞 (Truth)     ████████████████████████████████████  35%          │
│   ├── 타입 안전성 (Type Safety)                                     │
│   ├── 테스트 커버리지 (Test Coverage)                               │
│   └── 기술적 정확성 (Technical Accuracy)                            │
│                                                                     │
│   善 (Goodness)  ████████████████████████████████████  35%          │
│   ├── 보안 (Security)                                               │
│   ├── 안정성 (Stability)                                            │
│   └── 에러 처리 (Error Handling)                                    │
│                                                                     │
│   美 (Beauty)    ████████████████████████  20%                      │
│   ├── 코드 명확성 (Clarity)                                         │
│   ├── 문서화 (Documentation)                                        │
│   └── UX/DX (Developer Experience)                                  │
│                                                                     │
│   孝 (Serenity)  ████████  8%                                       │
│   ├── 유지보수성 (Maintainability)                                  │
│   ├── 인지 부하 (Cognitive Load)                                    │
│   └── 코드 단순성 (Simplicity)                                      │
│                                                                     │
│   永 (Eternity)  ██  2%                                             │
│   ├── 장기 지속가능성 (Sustainability)                              │
│   ├── 기술 부채 (Tech Debt)                                         │
│   └── 확장성 (Scalability)                                          │
│                                                                     │
│   ═══════════════════════════════════════════════════════════════   │
│   Trinity Score = 0.35×眞 + 0.35×善 + 0.20×美 + 0.08×孝 + 0.02×永   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 五柱 상세 평가 기준

### 眞 (Truth) - 35%

| 항목 | 측정 방법 | 만점 기준 |
|------|----------|----------|
| **타입 안전성** | mypy/tsc 에러 수 | 0 에러 |
| **테스트 커버리지** | pytest --cov / vitest | ≥85% |
| **스펙 일치** | 요구사항 vs 구현 | 100% 일치 |
| **API 계약** | OpenAPI/TypeScript 타입 | 완전 정의 |

```bash
# 眞 측정 명령어
mypy . --strict                    # Python 타입 체크
npx tsc --noEmit                   # TypeScript 타입 체크
pytest --cov=app --cov-report=json # 커버리지
```

### 善 (Goodness) - 35%

| 항목 | 측정 방법 | 만점 기준 |
|------|----------|----------|
| **보안 취약점** | bandit/npm audit | 0 critical/high |
| **에러 처리** | try-catch 커버리지 | 모든 외부 호출 |
| **입력 검증** | 검증 로직 존재 | 모든 경계 |
| **안전한 기본값** | 실패 시 동작 | graceful degradation |

```bash
# 善 측정 명령어
bandit -r . -f json                # Python 보안
npm audit --json                   # Node.js 보안
pip-audit --format json            # Python 의존성
```

### 美 (Beauty) - 20%

| 항목 | 측정 방법 | 만점 기준 |
|------|----------|----------|
| **린트 통과** | ruff/eslint | 0 에러 |
| **포맷팅** | black/prettier | 자동 포맷 일치 |
| **네이밍** | 일관된 명명규칙 | 컨벤션 준수 |
| **문서화** | docstring/JSDoc | 공개 API 100% |

```bash
# 美 측정 명령어
ruff check . --statistics          # Python 린트
npx eslint . --format json         # JS/TS 린트
ruff format --check .              # Python 포맷
npx prettier --check .             # JS/TS 포맷
```

### 孝 (Serenity) - 8%

| 항목 | 측정 방법 | 만점 기준 |
|------|----------|----------|
| **복잡도** | radon cc / eslint | ≤10 per function |
| **함수 길이** | LOC per function | ≤50 lines |
| **중첩 깊이** | max nesting | ≤3 levels |
| **의존성** | import 수 | ≤10 per file |

```bash
# 孝 측정 명령어
radon cc . -j                      # Python 복잡도
npx eslint . --rule 'complexity: error' # JS 복잡도
```

### 永 (Eternity) - 2%

| 항목 | 측정 방법 | 만점 기준 |
|------|----------|----------|
| **의존성 최신화** | outdated packages | 6개월 이내 |
| **기술 부채** | TODO/FIXME 수 | ≤5개 |
| **확장 가능성** | 아키텍처 리뷰 | SOLID 준수 |
| **EOL 리스크** | 사용 기술 수명 | 지원 종료 없음 |

```bash
# 永 측정 명령어
pip list --outdated --format json  # Python 의존성
npm outdated --json                # Node.js 의존성
grep -r "TODO\|FIXME" . --include="*.py" | wc -l
```

---

## 4-Gate CI Protocol

```
┌─────────────────────────────────────────────────────────────────────┐
│                         4-Gate Protocol                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Gate 1: 眞 (Truth)                                                 │
│  ├── pyright / tsc                                                  │
│  ├── pytest / vitest                                                │
│  └── ❌ 실패 시: 즉시 중단                                          │
│       │                                                             │
│       ▼                                                             │
│  Gate 2: 美 (Beauty)                                                │
│  ├── ruff / eslint                                                  │
│  ├── black / prettier                                               │
│  └── ❌ 실패 시: 자동 수정 후 재시도                                │
│       │                                                             │
│       ▼                                                             │
│  Gate 3: 善 (Goodness)                                              │
│  ├── bandit / npm audit                                             │
│  ├── pip-audit / snyk                                               │
│  └── ❌ critical 발견 시: 즉시 중단                                 │
│       │                                                             │
│       ▼                                                             │
│  Gate 4: 永 (Eternity)                                              │
│  ├── SBOM 생성                                                      │
│  ├── 의존성 라이선스 검사                                           │
│  └── Security Seal 발급                                             │
│       │                                                             │
│       ▼                                                             │
│  ✅ Trinity Score 계산 & 리포트 생성                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Trinity Score 해석

| Score | 상태 | 조치 |
|-------|------|------|
| **90+** | Excellent | Auto-approve 가능 |
| **70-89** | Good | 리뷰 권장 |
| **50-69** | Needs Work | 개선 필수 |
| **<50** | Critical | 병합 차단 |

### Score별 자동 조치

```yaml
auto_actions:
  score_90_plus:
    - auto_approve: true
    - notify: "slack#releases"
    - badge: "Trinity Certified"

  score_70_89:
    - require_review: true
    - suggest_improvements: true

  score_50_69:
    - block_merge: false
    - require_review: true
    - create_improvement_tasks: true

  score_below_50:
    - block_merge: true
    - alert: "slack#critical"
    - require_senior_review: true
```

---

## 三 Strategists (세 전략가)

코드 리뷰 시 세 가지 관점에서 분석:

### 장영실 (Jang Yeong-sil) - 技術 (眞)

```markdown
## 장영실의 기술 분석

### 관점
- 기술적 정확성과 혁신성
- 알고리즘 효율성
- 시스템 아키텍처

### 평가 항목
1. 타입 시스템 활용도
2. 테스트 설계 품질
3. 성능 최적화 수준
4. 기술적 독창성
```

### 이순신 (Yi Sun-sin) - 防禦 (善)

```markdown
## 이순신의 방어 분석

### 관점
- 보안과 안정성
- 위험 대비
- 전략적 방어

### 평가 항목
1. 보안 취약점 존재 여부
2. 에러 복구 전략
3. 장애 격리 수준
4. 입력 검증 완전성
```

### 신사임당 (Shin Saimdang) - 調和 (美)

```markdown
## 신사임당의 조화 분석

### 관점
- 코드의 아름다움
- 사용자/개발자 경험
- 균형과 조화

### 평가 항목
1. 코드 가독성
2. 문서화 품질
3. API 직관성
4. 전체적 일관성
```

---

## 사용법

### 기본 사용

```bash
# Claude Code에서
/trinity                    # 전체 프로젝트 평가
/trinity src/               # 특정 디렉토리 평가
/trinity --quick            # 빠른 평가 (眞善만)
```

### 옵션

| 옵션 | 설명 |
|------|------|
| `--quick` | 眞善만 평가 (빠름) |
| `--full` | 五柱 전체 평가 |
| `--report` | 상세 리포트 생성 |
| `--ci` | CI 모드 (exit code 반환) |
| `--threshold N` | 최소 점수 설정 |

### CI/CD 통합

```yaml
# .github/workflows/trinity.yml
name: Trinity Quality Gate

on: [push, pull_request]

jobs:
  trinity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trinity Check
        run: |
          # Gate 1: Truth
          mypy . --strict
          pytest --cov=app --cov-fail-under=70

          # Gate 2: Beauty
          ruff check . --fix
          ruff format .

          # Gate 3: Goodness
          bandit -r . -ll
          pip-audit

          # Gate 4: Eternity
          pip-licenses --format=json > sbom.json
```

---

## 리포트 형식

### Trinity Report Template

```markdown
# Trinity Score Report

**Project**: my-project
**Date**: 2025-01-30
**Trinity Score**: 85/100 ⭐⭐⭐⭐

## 五柱 점수

| 柱 | 점수 | 가중치 | 기여도 |
|----|------|--------|--------|
| 眞 (Truth) | 90 | 35% | 31.5 |
| 善 (Goodness) | 85 | 35% | 29.75 |
| 美 (Beauty) | 80 | 20% | 16.0 |
| 孝 (Serenity) | 75 | 8% | 6.0 |
| 永 (Eternity) | 70 | 2% | 1.4 |
| **Total** | | | **84.65** |

## 三 Strategists 분석

### 장영실 (技術)
- ✅ 타입 안전성 우수
- ✅ 테스트 커버리지 85%
- ⚠️ 일부 복잡한 쿼리 최적화 필요

### 이순신 (防禦)
- ✅ 보안 취약점 없음
- ✅ 입력 검증 완료
- ⚠️ rate limiting 추가 권장

### 신사임당 (調和)
- ✅ 코드 스타일 일관됨
- ⚠️ API 문서 보완 필요
- ⚠️ 에러 메시지 사용자 친화적 개선 필요

## 개선 권장사항

### 우선순위 High
1. `src/services/query.py:45` - 복잡도 15 → 리팩토링
2. API 문서화 보완 (OpenAPI spec)

### 우선순위 Medium
1. Rate limiting 미들웨어 추가
2. 에러 메시지 국제화

### 우선순위 Low
1. 의존성 업데이트 (3개 outdated)

## 결론

✅ **Approved** - 머지 가능, 권장사항 후속 작업으로 처리
```

---

## evaluation 스킬과 통합

Trinity는 기존 evaluation 스킬을 **확장**합니다:

```
evaluation (기존)
├── 코드 품질 메트릭
├── 에이전트 성능 메트릭
└── 비용 메트릭

    +

trinity (신규)
├── 五柱 철학 평가
├── 4-Gate Protocol
├── 三 Strategists 분석
└── Trinity Score

    ↓

통합된 평가 시스템
├── 정량적 메트릭 (evaluation)
├── 철학적 평가 (trinity)
└── 종합 품질 점수
```

---

## auto-orchestrate 연동

```markdown
## Phase 완료 시 Trinity 자동 실행

Phase 구현 완료 후 병합 전:

1. **4-Gate Protocol 실행**
   - Gate 1-4 순차 통과

2. **Trinity Score 계산**
   - 70점 미만: 병합 차단
   - 70-89점: 리뷰 필수
   - 90점 이상: 자동 승인

3. **리포트 생성**
   - `.claude/metrics/trinity/` 저장
   - Slack 알림 (설정 시)
```

---

## 참조 파일

- `references/pillar-weights.md` - 五柱 가중치 조정 가이드
- `references/gate-scripts.md` - 4-Gate CI 스크립트
- `references/strategist-prompts.md` - 三 Strategists 프롬프트
