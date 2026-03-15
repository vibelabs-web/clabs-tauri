---
name: reflection
description: 에이전트가 자신의 출력을 비판적으로 검토하고 반복 개선하는 자기 성찰 패턴.
trigger: /reflection 또는 "코드 검토해줘", "다시 확인해봐", "개선해줘" 키워드
---

# Reflection Skill

> 에이전트가 자신의 출력을 비판적으로 검토하고 반복 개선하는 자기 성찰 패턴

## 핵심 개념

```
1차 출력 → 자체 비판 → 문제점 식별 → 개선 → 2차 출력 → ... → 최종 출력
```

**Reflection Loop**:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Generate → Critique → Identify → Improve     │
│       ↑                              │         │
│       └──────── (max 3회) ───────────┘         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 워크플로우

### 1단계: 대상 식별

```
사용자 요청 분석:
├── 새 코드 작성 요청 → 작성 후 Reflection
├── 기존 코드 개선 요청 → 즉시 Reflection
└── 특정 파일 지정 → 해당 파일 Reflection
```

### 2단계: 1차 출력 (Generation)

```markdown
## 1차 출력

[코드 또는 결과물 작성]
```

### 3단계: 자체 비판 (Critique)

**반드시 다음 관점에서 비판적으로 검토:**

#### 기능적 검토
- [ ] 요구사항을 모두 충족하는가?
- [ ] 엣지 케이스를 처리하는가?
- [ ] 에러 핸들링이 적절한가?

#### 코드 품질 (TRUST 5)
- [ ] **T**est: 테스트 가능한 구조인가?
- [ ] **R**eadable: 읽기 쉬운가? (변수명, 주석)
- [ ] **U**nified: 코딩 컨벤션을 따르는가?
- [ ] **S**ecured: 보안 취약점이 없는가?
- [ ] **T**rackable: TAG 시스템이 적용되었는가?

#### 성능 검토
- [ ] 불필요한 연산이 없는가?
- [ ] 메모리 효율적인가?
- [ ] 시간 복잡도가 적절한가?

#### 설계 검토
- [ ] 단일 책임 원칙을 따르는가?
- [ ] 확장 가능한 구조인가?
- [ ] 의존성이 적절한가?

### 4단계: 문제점 식별 (Identify)

```markdown
## 발견된 문제점

### Critical (즉시 수정)
1. [문제 설명]
   - 위치: `파일:라인`
   - 이유: ...
   - 해결책: ...

### Major (권장 수정)
1. [문제 설명]
   - 위치: `파일:라인`
   - 이유: ...
   - 해결책: ...

### Minor (선택 수정)
1. [문제 설명]
```

### 5단계: 개선 (Improve)

```markdown
## 개선된 코드

[Critical + Major 문제 수정된 코드]

### 변경 사항
- [변경 1]: 이유
- [변경 2]: 이유
```

### 6단계: 반복 판단

```
문제점 남아있음?
├── Critical 있음 → 재반복 (최대 3회)
├── Major만 있음 → 1회 더 반복
└── Minor만 있음 → 종료
```

### 7단계: 최종 출력

```markdown
## Reflection 완료

### 반복 횟수: N회

### 최종 코드
[개선 완료된 코드]

### 개선 요약
| 반복 | 발견 | 수정 |
|------|------|------|
| 1차 | Critical 2, Major 3 | 5건 수정 |
| 2차 | Major 1 | 1건 수정 |
| 최종 | Minor 1 (허용) | - |

### 잔여 이슈 (Minor)
- [선택적 개선 사항]
```

---

## Reflection 유형

### 1. Code Reflection (코드 자기 검토)

```bash
/reflection code [파일경로]
```

**검토 항목**:
- 로직 오류
- 보안 취약점
- 성능 이슈
- 코드 스타일

### 2. Design Reflection (설계 자기 검토)

```bash
/reflection design [파일경로]
```

**검토 항목**:
- 아키텍처 적절성
- 패턴 적용
- 확장성
- 의존성 관리

### 3. Test Reflection (테스트 자기 검토)

```bash
/reflection test [파일경로]
```

**검토 항목**:
- 테스트 커버리지
- 엣지 케이스
- 모킹 적절성
- 테스트 독립성

### 4. Full Reflection (전체 검토)

```bash
/reflection full [파일경로]
```

모든 유형 통합 검토

---

## 자동 Reflection 트리거

다음 상황에서 자동으로 Reflection 실행:

| 트리거 | 조건 |
|--------|------|
| 코드 작성 완료 | 50줄 이상 새 코드 |
| API 엔드포인트 | 새 라우트 추가 시 |
| 보안 관련 | 인증/권한 코드 |
| 복잡한 로직 | 중첩 3단계 이상 |

---

## 다른 스킬과 연동

### vercel-review 연동

```
Reflection (구조/로직)
    ↓
vercel-review (성능/접근성)
    ↓
최종 승인
```

### security-specialist 연동

```
Reflection (일반 검토)
    ↓
security-specialist (보안 심층 검토)
    ↓
최종 승인
```

### test-specialist 연동

```
코드 작성
    ↓
Reflection (코드 품질)
    ↓
test-specialist (테스트 작성)
    ↓
Reflection (테스트 품질)
```

---

## 출력 형식

### 간략 모드 (기본)

```
🔄 Reflection 시작 (대상: src/api/auth.py)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 1차 검토:
   - Critical: 1건 (SQL Injection 취약점)
   - Major: 2건

🔧 1차 개선 완료

📝 2차 검토:
   - Critical: 0건
   - Major: 0건
   - Minor: 1건 (허용)

✅ Reflection 완료 (2회 반복)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 상세 모드

```bash
/reflection --verbose [파일경로]
```

각 단계별 상세 출력

---

## 설정

### 최대 반복 횟수

```
기본값: 3회
설정: /reflection --max-iterations 5
```

### 엄격도

```
--strict    : Minor도 모두 수정
--normal    : Critical + Major 수정 (기본)
--relaxed   : Critical만 수정
```

### 자동 적용

```
--apply     : 개선사항 자동 적용
--dry-run   : 검토만 (변경 없음, 기본)
```

---

## 예시

### 예시 1: 함수 Reflection

**입력**:
```python
def get_user(id):
    query = f"SELECT * FROM users WHERE id = {id}"
    return db.execute(query)
```

**Reflection 출력**:
```
📝 1차 검토:
   Critical: SQL Injection 취약점 (라인 2)
   Major: 타입 힌트 누락, 에러 핸들링 없음

🔧 개선된 코드:
```

```python
# @TASK T1.1 - 사용자 조회 API
# @SPEC docs/planning/02-trd.md#사용자-조회
async def get_user(user_id: int) -> User | None:
    """사용자 ID로 사용자 정보 조회"""
    try:
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error(f"사용자 조회 실패: {e}")
        raise DatabaseError("사용자 조회 중 오류 발생")
```

```
📝 2차 검토:
   Critical: 0건
   Major: 0건
   Minor: 1건 (docstring 확장 권장)

✅ Reflection 완료 (2회 반복)
```

---

## 주의사항

1. **무한 루프 방지**: 최대 반복 횟수 제한 (기본 3회)
2. **과도한 개선 방지**: Minor는 기본적으로 허용
3. **원본 보존**: `--apply` 없으면 변경 없음
4. **컨텍스트 유지**: 전체 파일 맥락에서 검토

---

## 품질 지표

Reflection 완료 후 품질 점수 제공:

```
📊 품질 점수: 85/100

| 항목 | 점수 | 비고 |
|------|------|------|
| 기능성 | 90 | 모든 요구사항 충족 |
| 보안 | 85 | OWASP 준수 |
| 가독성 | 80 | 일부 주석 보강 필요 |
| 테스트 | 85 | 커버리지 적절 |
```
