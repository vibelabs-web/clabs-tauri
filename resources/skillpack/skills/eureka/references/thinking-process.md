# 재귀적 사고 프로세스

## 개요

Eureka의 핵심은 AI가 내부적으로 재귀적 사고를 수행하여 추상적 아이디어를 구체화하는 것입니다.

---

## 사고 루프 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    Recursive Thinking Loop                      │
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │  EXPAND  │ → │ RESEARCH │ → │  EVOLVE  │                  │
│   │  확장    │    │  조사    │    │  진화    │                  │
│   └──────────┘    └──────────┘    └──────────┘                 │
│        │                               │                        │
│        │         ┌──────────┐          │                        │
│        └──────── │ VALIDATE │ ◀────────┘                        │
│                  │  검증    │                                   │
│                  └──────────┘                                   │
│                       │                                         │
│                       ▼                                         │
│              충분히 구체적인가?                                  │
│              YES → 종료 / NO → 반복                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 라운드별 상세

### Round 1: EXPAND (확장)

**목표**: 아이디어의 의미 공간 확장

```yaml
input: "여행 일정 공유"

process:
  - 핵심 개념 분해:
      - 여행 (travel, trip, journey)
      - 일정 (schedule, itinerary, plan)
      - 공유 (share, collaborate, together)

  - 연관 개념 확장:
      - 여행 → 관광, 출장, 배낭여행, 가족여행
      - 일정 → 시간, 장소, 예약, 동선
      - 공유 → 협업, 소통, 동기화, 알림

  - 암묵적 니즈 추론:
      - "공유"가 있으므로 → 그룹/협업 니즈
      - "일정"이 있으므로 → 계획/관리 니즈
      - "여행"이 있으므로 → 지도/위치 니즈

output:
  domain: "여행 협업"
  core_needs: ["일정 관리", "그룹 협업", "정보 공유"]
  keywords: ["travel", "itinerary", "collaborate", "group", "plan"]
```

### Round 2: RESEARCH (조사)

**목표**: 기존 솔루션 조사 및 시장 이해

```yaml
actions:
  - WebSearch("travel itinerary app 2024")
  - WebSearch("trip planning collaboration tool")
  - WebSearch("best travel planner app comparison")

findings:
  existing_solutions:
    - name: "TripIt"
      features: ["일정 자동 정리", "예약 연동", "공유"]
      weakness: "실시간 협업 없음"

    - name: "Wanderlog"
      features: ["AI 추천", "지도 통합", "오프라인"]
      weakness: "그룹 기능 약함"

    - name: "Google Travel"
      features: ["검색 연동", "무료", "단순함"]
      weakness: "기능 제한적"

  market_insight:
    - 개인 여행 앱은 포화
    - 그룹 협업 특화 앱 부족
    - 실시간 동시 편집 지원 앱 거의 없음
```

### Round 3: EVOLVE (진화)

**목표**: 한계점에서 기회 도출

```yaml
gap_analysis:
  - gap: "실시간 협업 부재"
    opportunity: "Google Docs처럼 동시 편집"
    feasibility: "높음 (기존 기술 존재)"

  - gap: "현지인 정보 부족"
    opportunity: "현지인 가이드 매칭"
    feasibility: "중간 (양면 마켓 필요)"

  - gap: "앱 설치 장벽"
    opportunity: "웹 링크만으로 공유"
    feasibility: "높음 (PWA로 구현)"

  - gap: "오프라인 지원 부족"
    opportunity: "오프라인 우선 설계"
    feasibility: "중간 (동기화 복잡)"

differentiation_paths:
  - path_a: "실시간 협업 특화"
  - path_b: "현지인 연결 특화"
  - path_c: "극단적 단순함 특화"
  - path_d: "오프라인 특화"
```

### Round 4: VALIDATE (검증)

**목표**: 각 방향의 실현 가능성 검증

```yaml
validation_matrix:
  - path: "실시간 협업"
    technical: "WebSocket, CRDT → 가능"
    market: "Notion, Figma 성공 사례 → 검증됨"
    mvp_scope: "6화면, 2주"
    score: 8/10

  - path: "현지인 연결"
    technical: "매칭 알고리즘 → 가능"
    market: "양면 마켓 콜드스타트 문제"
    mvp_scope: "8화면, 4주"
    score: 5/10

  - path: "극단적 단순함"
    technical: "기본 CRUD → 매우 쉬움"
    market: "단순함 자체가 차별점"
    mvp_scope: "4화면, 1주"
    score: 9/10 ⭐

recommendation:
  primary: "극단적 단순함" (가장 빠른 검증)
  secondary: "실시간 협업" (차별화 강함)
```

### Round 5: SYNTHESIZE (종합)

**목표**: 최종 제안 3-4개 생성

```yaml
proposals:
  - id: 1
    name: "TripSync"
    tagline: "실시간 여행 협업 플래너"
    path: "실시간 협업"
    features: ["동시 편집", "투표", "비용 분담"]
    screens: 6
    complexity: "보통"

  - id: 2
    name: "LocalTrip"
    tagline: "현지인 추천 여행 플래너"
    path: "현지인 연결"
    features: ["가이드 매칭", "AI 일정", "채팅"]
    screens: 8
    complexity: "복잡"

  - id: 3
    name: "QuickTrip"
    tagline: "링크 하나로 일정 공유"
    path: "극단적 단순함"
    features: ["링크 공유", "댓글", "지도"]
    screens: 4
    complexity: "간단"
    recommended: true

mvp_recommendation: "QuickTrip"
reason: "가장 빠르게 시장 검증 가능, 기술적 위험 최소"
```

---

## 사고 품질 기준

### 좋은 사고의 특징

| 특징 | 설명 |
|------|------|
| **구체성** | "좋은 앱" → "실시간 동시 편집 지원 앱" |
| **근거 기반** | "느낌" → "WebSearch 결과 기반 판단" |
| **대안 제시** | "이것만 가능" → "3-4개 경로 제시" |
| **실현 가능성** | "이론적으로 가능" → "MVP 범위 정의" |

### 나쁜 사고의 특징

| 특징 | 문제 |
|------|------|
| **모호함** | "좋은 서비스가 될 것" |
| **근거 없음** | "아마도 시장이 있을 것" |
| **단일 경로** | "이것만이 답" |
| **비현실적** | "6개월 안에 슈퍼앱" |

---

## 라운드 조절

### --fast 모드 (2라운드)

```
Round 1: EXPAND + RESEARCH (통합)
Round 2: EVOLVE + VALIDATE (통합)
→ 2개 제안 생성
```

### --deep 모드 (7라운드)

```
Round 1: EXPAND (확장)
Round 2: RESEARCH - 시장 (조사)
Round 3: RESEARCH - 기술 (조사)
Round 4: EVOLVE (진화)
Round 5: VALIDATE - 시장 (검증)
Round 6: VALIDATE - 기술 (검증)
Round 7: SYNTHESIZE (종합)
→ 5-6개 제안 생성
```

---

## WebSearch 전략

### 검색 쿼리 패턴

```
# 시장 조사
"{도메인} app 2024"
"{도메인} saas"
"best {도메인} tool"

# 경쟁 분석
"{기존앱} alternatives"
"{기존앱} vs"
"{도메인} comparison"

# 트렌드
"{도메인} trends 2024"
"{도메인} startup funding"
```

### 결과 활용

```yaml
from_search:
  - 기존 플레이어 목록
  - 주요 기능 비교
  - 사용자 불만 (리뷰)
  - 가격 정책
  - 기술 스택 힌트
```

---

## 종료 조건

사고 루프는 다음 조건 충족 시 종료:

1. **3개 이상 구체적 제안 생성**
2. **각 제안의 MVP 범위 정의 완료**
3. **차별점 명확히 정의됨**
4. **복잡도 평가 완료**

또는:

- **최대 라운드 도달** (기본 5, --deep 7)
- **더 이상 새로운 인사이트 없음**
