---
name: reasoning
description: Chain of Thought, Tree of Thought, ReAct 등 복잡한 문제 해결을 위한 추론 기법 제공.
trigger: 복잡한 버그 디버깅, 아키텍처 설계 결정, 다중 옵션 비교 분석 시 자동 적용
---

# Reasoning Techniques 스킬

> **Agentic Design Patterns #6-8**: Chain of Thought, Tree of Thought, 복잡한 문제 해결을 위한 추론 기법

## 개요

복잡한 문제를 체계적으로 분해하고 해결하기 위한 추론 기법을 제공합니다.

## 핵심 원칙

```
┌─────────────────────────────────────────────────────────────┐
│  Reasoning Techniques                                       │
│                                                             │
│  1. Chain of Thought (CoT) - 단계별 논리 전개               │
│  2. Tree of Thought (ToT) - 분기 탐색 후 최적 선택          │
│  3. ReAct - Reasoning + Acting 반복                        │
│                                                             │
│  적용 시점:                                                  │
│  ├── 복잡한 버그 디버깅                                     │
│  ├── 아키텍처 설계 결정                                     │
│  └── 다중 옵션 비교 분석                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Chain of Thought (CoT)

### 개념

복잡한 문제를 작은 단계로 분해하여 순차적으로 추론합니다.

```
문제 → 단계 1 → 단계 2 → 단계 3 → ... → 결론
```

### 적용 예시: 버그 디버깅

```markdown
## 🔍 Chain of Thought: 로그인 실패 버그

### 문제
사용자가 올바른 비밀번호로도 로그인 실패

### 단계별 추론

**Step 1: 증상 분석**
- 에러 메시지: "Invalid credentials"
- 서버 로그: 비밀번호 검증 함수 도달함
- DB: 사용자 레코드 존재함
→ 결론: 비밀번호 검증 로직 문제 가능성

**Step 2: 비밀번호 검증 코드 확인**
```python
def verify_password(plain, hashed):
    return bcrypt.checkpw(plain, hashed)  # ← 여기 확인
```
- plain: bytes 필요
- 현재: str 전달
→ 결론: 타입 불일치 발견

**Step 3: 원인 확정**
- `bcrypt.checkpw()`는 bytes 인자 필요
- 현재 str을 전달하여 항상 False 반환
→ 결론: `.encode('utf-8')` 누락

**Step 4: 해결책**
```python
def verify_password(plain: str, hashed: bytes) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed)
```

### 검증
- [x] 테스트 작성
- [x] 테스트 통과
- [x] 기존 기능 영향 없음
```

### CoT 템플릿

```markdown
## 🔍 Chain of Thought: {{문제 제목}}

### 문제
{{문제 설명}}

### 단계별 추론

**Step 1: {{단계명}}**
{{분석 내용}}
→ 결론: {{중간 결론}}

**Step 2: {{단계명}}**
{{분석 내용}}
→ 결론: {{중간 결론}}

**Step 3: {{단계명}}**
{{분석 내용}}
→ 결론: {{최종 결론}}

### 해결책
{{코드 또는 설명}}

### 검증
- [ ] {{검증 항목 1}}
- [ ] {{검증 항목 2}}
```

---

## 🌳 Tree of Thought (ToT)

### 개념

여러 가능한 경로를 탐색하고 평가하여 최적의 선택을 합니다.

```
         문제
        /    \
      옵션A   옵션B
      /  \     /  \
    A1   A2  B1   B2
         ↑
      최적 선택
```

### 적용 예시: 아키텍처 결정

```markdown
## 🌳 Tree of Thought: 상태 관리 선택

### 문제
React 앱에서 전역 상태 관리 방법 결정

### 옵션 트리

```
상태 관리 선택
├── Option A: Redux Toolkit
│   ├── 장점: 표준화, DevTools, 큰 앱에 적합
│   ├── 단점: 보일러플레이트, 학습 곡선
│   └── 점수: 7/10
│
├── Option B: Zustand
│   ├── 장점: 간단, 작은 번들, TypeScript 친화
│   ├── 단점: 복잡한 미들웨어 부족
│   └── 점수: 8/10 ⭐
│
├── Option C: Context + useReducer
│   ├── 장점: 외부 의존성 없음, React 내장
│   ├── 단점: 리렌더링 최적화 어려움
│   └── 점수: 6/10
│
└── Option D: Jotai
    ├── 장점: 원자적 상태, 간단 API
    ├── 단점: 복잡한 비동기 처리 어려움
    └── 점수: 7/10
```

### 평가 기준

| 기준 | 가중치 | A | B | C | D |
|------|--------|---|---|---|---|
| 학습 용이성 | 20% | 6 | 9 | 8 | 7 |
| 번들 크기 | 15% | 5 | 9 | 10 | 8 |
| TypeScript | 20% | 8 | 9 | 7 | 9 |
| 확장성 | 25% | 9 | 7 | 5 | 6 |
| 커뮤니티 | 20% | 9 | 7 | 8 | 6 |
| **총점** | 100% | **7.4** | **8.1** | **7.2** | **7.1** |

### 결정
**Option B: Zustand** 선택

### 이유
1. 프로젝트 규모 (중소형)에 적합
2. TypeScript 지원 우수
3. 학습 곡선 완만
4. 필요시 미들웨어 추가 가능
```

### ToT 템플릿

```markdown
## 🌳 Tree of Thought: {{결정 제목}}

### 문제
{{결정이 필요한 상황}}

### 옵션 트리

```
{{문제}}
├── Option A: {{옵션명}}
│   ├── 장점: {{장점들}}
│   ├── 단점: {{단점들}}
│   └── 점수: X/10
│
├── Option B: {{옵션명}}
│   ├── 장점: {{장점들}}
│   ├── 단점: {{단점들}}
│   └── 점수: X/10 ⭐
│
└── Option C: {{옵션명}}
    ├── 장점: {{장점들}}
    ├── 단점: {{단점들}}
    └── 점수: X/10
```

### 평가 기준

| 기준 | 가중치 | A | B | C |
|------|--------|---|---|---|
| {{기준1}} | X% | X | X | X |
| {{기준2}} | X% | X | X | X |
| **총점** | 100% | X | X | X |

### 결정
**Option {{선택}}** 선택

### 이유
{{선택 이유}}
```

---

## 🔄 ReAct (Reasoning + Acting)

### 개념

추론과 행동을 반복하며 점진적으로 문제를 해결합니다.

```
Thought → Action → Observation → Thought → Action → ...
```

### 적용 예시: API 통합 디버깅

```markdown
## 🔄 ReAct: 외부 API 연동 문제

### Cycle 1

**Thought:** API 호출이 실패한다. 먼저 네트워크 연결 확인 필요.

**Action:** curl로 API 엔드포인트 테스트
```bash
curl -v https://api.example.com/v1/users
```

**Observation:** 403 Forbidden 응답. 인증 문제로 보임.

---

### Cycle 2

**Thought:** 인증 헤더가 필요한 것 같다. API 문서 확인.

**Action:** API 문서에서 인증 방식 확인
```
Auth: Bearer token required
Header: Authorization: Bearer <token>
```

**Observation:** Bearer 토큰 필요. 현재 코드에 헤더 없음.

---

### Cycle 3

**Thought:** Authorization 헤더 추가 필요.

**Action:** 코드 수정
```python
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(url, headers=headers)
```

**Observation:** 200 OK! 문제 해결.

### 결론
- 원인: Authorization 헤더 누락
- 해결: Bearer 토큰 헤더 추가
```

---

## 🎯 적용 가이드라인

### 언제 어떤 기법을 사용할까?

| 상황 | 추천 기법 | 이유 |
|------|----------|------|
| 버그 원인 추적 | **CoT** | 순차적 논리 추적 필요 |
| 라이브러리 선택 | **ToT** | 다중 옵션 비교 필요 |
| API 통합 문제 | **ReAct** | 시행착오 반복 필요 |
| 복잡한 리팩토링 | **CoT** | 단계별 변환 필요 |
| 성능 최적화 | **ToT** | 여러 최적화 전략 비교 |
| 알 수 없는 에러 | **ReAct** | 탐색적 디버깅 필요 |

### 자동 적용 트리거

```yaml
auto_trigger:
  chain_of_thought:
    - error_debug_request        # "왜 이 에러가 나지?"
    - complex_logic_explanation  # "이 로직 설명해줘"
    - step_by_step_request       # "단계별로 해결해줘"

  tree_of_thought:
    - technology_choice          # "어떤 라이브러리 쓸까?"
    - architecture_decision      # "어떤 구조로 할까?"
    - comparison_request         # "A vs B 비교해줘"

  react:
    - unknown_error              # "알 수 없는 에러"
    - integration_problem        # "연동이 안 돼요"
    - exploratory_debug          # "뭐가 문제인지 모르겠어요"
```

---

## 🔗 다른 스킬과 연동

### Reflection 연동

```markdown
추론 결과 검증:
1. Reasoning으로 결론 도출
2. Reflection으로 결론 검증
3. 문제 발견 시 Reasoning 재실행
```

### Memory 연동

```markdown
추론 패턴 학습:
- 성공한 추론 패턴 기록
- 실패한 추론 경로 기록
- 유사 문제 시 참조
```

### Evaluation 연동

```markdown
추론 품질 측정:
- 추론 단계 수 (과도한 단계 경고)
- 결론까지 소요 시간
- 결론의 정확도 (실제 해결 여부)
```

---

## 활성화 조건

다음 상황에서 자동 활성화:
- 복잡한 버그 디버깅 요청
- 기술 선택 요청 ("어떤 걸 쓸까요?")
- "왜", "어떻게" 질문
- 비교 분석 요청
