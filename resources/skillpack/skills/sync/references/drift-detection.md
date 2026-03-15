# 드리프트 감지 알고리즘

## 드리프트 유형

### 1. 추가 드리프트 (Addition Drift)

코드에는 있지만 명세에 없는 항목

```
명세: [a, b, c]
코드: [a, b, c, d]  ← d가 추가됨

조치:
- 명세에 d 추가 (문서화)
- 또는 코드에서 d 제거 (불필요한 기능)
```

### 2. 삭제 드리프트 (Deletion Drift)

명세에는 있지만 코드에 없는 항목

```
명세: [a, b, c]
코드: [a, b]  ← c가 누락됨

조치:
- 코드에 c 구현 (미구현 기능)
- 또는 명세에서 c 제거 (폐기된 기능)
```

### 3. 수정 드리프트 (Modification Drift)

명세와 코드가 다른 항목

```
명세: field: string, required
코드: field: string, optional  ← 속성 변경됨

조치:
- 어느 쪽이 정확한지 확인
- 일치하도록 수정
```

## 감지 알고리즘

```python
def detect_drift(spec: Dict, code: Dict) -> DriftReport:
    """명세와 코드 사이의 드리프트 감지"""

    additions = []   # 코드에만 있음
    deletions = []   # 명세에만 있음
    modifications = []  # 둘 다 있지만 다름
    matches = []     # 완전 일치

    spec_keys = set(spec.keys())
    code_keys = set(code.keys())

    # 추가된 항목 (코드에만)
    for key in code_keys - spec_keys:
        additions.append({
            'key': key,
            'value': code[key],
            'type': 'addition'
        })

    # 삭제된 항목 (명세에만)
    for key in spec_keys - code_keys:
        deletions.append({
            'key': key,
            'value': spec[key],
            'type': 'deletion'
        })

    # 수정된 항목 (둘 다 있지만 다름)
    for key in spec_keys & code_keys:
        if not is_equivalent(spec[key], code[key]):
            modifications.append({
                'key': key,
                'spec': spec[key],
                'code': code[key],
                'type': 'modification'
            })
        else:
            matches.append(key)

    return DriftReport(
        additions=additions,
        deletions=deletions,
        modifications=modifications,
        matches=matches
    )
```

## 동등성 비교

### 타입 동등성

```yaml
equivalents:
  - [integer, int, Int, INTEGER]
  - [string, str, String, VARCHAR, TEXT]
  - [boolean, bool, Boolean, BOOLEAN]
  - [datetime, DateTime, TIMESTAMP]
```

### 속성 동등성

```yaml
equivalents:
  required:
    - required: true
    - nullable: false
    - NOT NULL
  optional:
    - required: false
    - nullable: true
```

## 우선순위

드리프트 심각도:

| 유형 | 심각도 | 설명 |
|------|--------|------|
| 삭제 드리프트 | High | 명세된 기능 미구현 |
| 수정 드리프트 | Medium | 동작 불일치 가능 |
| 추가 드리프트 | Low | 문서화 누락 |
