# Tier 분류 상세 규칙

## 키워드 기반 분류

### FREE Tier 키워드

```yaml
free_keywords:
  actions:
    - find
    - search
    - list
    - show
    - display
    - check
    - verify
    - read
    - get
    - look

  contexts:
    - "what is"
    - "where is"
    - "how many"
    - "which files"
```

### CHEAP Tier 키워드

```yaml
cheap_keywords:
  actions:
    - format
    - lint
    - fix
    - rename
    - add import
    - remove unused
    - update comment
    - add docstring
    - sort
    - organize

  modifiers:
    - simple
    - quick
    - minor
    - small
    - typo
```

### EXPENSIVE Tier 키워드

```yaml
expensive_keywords:
  actions:
    - implement
    - create
    - build
    - develop
    - refactor
    - redesign
    - architect
    - debug
    - fix bug
    - integrate
    - migrate

  modifiers:
    - complex
    - new feature
    - from scratch
    - entire
    - complete
```

## 변경 범위 기반 분류

```yaml
scope_thresholds:
  free:
    files_changed: 0
    lines_changed: 0

  cheap:
    files_changed: 1-3
    lines_changed: 1-20

  expensive:
    files_changed: "> 3"
    lines_changed: "> 20"
```

## 복잡도 지표

### 코드 복잡도

```yaml
complexity_indicators:
  low:  # CHEAP
    - single function change
    - no new dependencies
    - existing pattern follow
    - tests not required

  high:  # EXPENSIVE
    - multiple file changes
    - new dependencies
    - new pattern introduction
    - tests required
    - cross-cutting concerns
```

### 인지 복잡도

```yaml
cognitive_indicators:
  low:  # CHEAP
    - mechanical transformation
    - pattern matching
    - find and replace

  high:  # EXPENSIVE
    - reasoning required
    - trade-off decisions
    - multiple valid approaches
    - error handling design
```

## 컨텍스트 기반 조정

### 업그레이드 조건

```yaml
upgrade_to_expensive:
  - security_related: true
  - payment_related: true
  - authentication: true
  - data_migration: true
  - breaking_changes: true
```

### 다운그레이드 조건

```yaml
downgrade_to_cheap:
  - has_template: true
  - repetitive_pattern: true
  - similar_task_succeeded_cheap: true
```

## 분류 결정 트리

```
태스크 분석
    │
    ├─ 코드 변경 없음? ──▶ FREE
    │
    ├─ 변경 범위 ≤ 20줄, ≤ 3파일?
    │   │
    │   ├─ 보안/결제 관련? ──▶ EXPENSIVE
    │   │
    │   └─ 단순 패턴 변경? ──▶ CHEAP
    │
    └─ 변경 범위 > 20줄 또는 > 3파일?
        │
        └─ EXPENSIVE
```
