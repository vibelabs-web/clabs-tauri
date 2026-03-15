# 메트릭 JSON 스키마

## 코드 품질 메트릭

### coverage.json

```json
{
  "$schema": "metrics/coverage",
  "version": "1.0",
  "history": [
    {
      "date": "2025-01-17",
      "phase": "1",
      "task": "T1.1",
      "value": 75.5,
      "details": {
        "lines": 75.5,
        "branches": 68.2,
        "functions": 82.1
      },
      "files": {
        "app/api/routes/auth.py": 85.0,
        "app/services/auth_service.py": 72.3,
        "app/models/user.py": 90.0
      },
      "uncovered": [
        "app/services/auth_service.py:45-52",
        "app/services/auth_service.py:78-85"
      ]
    }
  ],
  "current": {
    "value": 75.5,
    "trend": "improving",
    "delta": "+3.2%"
  },
  "thresholds": {
    "minimum": 70,
    "target": 85,
    "status": "passing"
  }
}
```

### complexity.json

```json
{
  "$schema": "metrics/complexity",
  "version": "1.0",
  "history": [
    {
      "date": "2025-01-17",
      "phase": "1",
      "average": 6.8,
      "max": 12,
      "files": {
        "app/services/auth_service.py": {
          "average": 8.5,
          "functions": {
            "authenticate": 12,
            "validate_token": 5,
            "refresh_token": 8
          }
        }
      },
      "warnings": [
        {
          "file": "app/services/auth_service.py",
          "function": "authenticate",
          "complexity": 12,
          "threshold": 10,
          "recommendation": "Extract validation logic to separate function"
        }
      ]
    }
  ],
  "thresholds": {
    "warning": 10,
    "error": 15
  }
}
```

### security.json

```json
{
  "$schema": "metrics/security",
  "version": "1.0",
  "history": [
    {
      "date": "2025-01-17",
      "phase": "1",
      "summary": {
        "critical": 0,
        "high": 0,
        "medium": 1,
        "low": 3
      },
      "issues": [
        {
          "severity": "medium",
          "type": "hardcoded-password-default",
          "file": "app/config.py",
          "line": 25,
          "message": "Possible hardcoded password in default value",
          "cwe": "CWE-259",
          "fixed": true
        }
      ],
      "dependencies": {
        "total": 45,
        "vulnerable": 0,
        "outdated": 3
      }
    }
  ],
  "thresholds": {
    "critical": 0,
    "high": 0
  }
}
```

---

## 에이전트 성능 메트릭

### tasks.json

```json
{
  "$schema": "metrics/tasks",
  "version": "1.0",
  "sessions": [
    {
      "session_id": "2025-01-17-001",
      "started_at": "2025-01-17T09:00:00Z",
      "completed_at": "2025-01-17T12:30:00Z",
      "tasks": [
        {
          "id": "T1.1",
          "phase": "1",
          "agent": "backend-specialist",
          "status": "completed",
          "attempts": 2,
          "started_at": "2025-01-17T09:15:00Z",
          "completed_at": "2025-01-17T10:30:00Z",
          "errors": [
            {
              "attempt": 1,
              "error": "ImportError: pydantic.BaseSettings",
              "resolution": "Updated import to pydantic_settings"
            }
          ]
        }
      ],
      "summary": {
        "total_tasks": 8,
        "completed": 8,
        "failed": 0,
        "completion_rate": 100,
        "first_attempt_success": 6,
        "first_attempt_rate": 75,
        "average_retries": 1.25
      }
    }
  ]
}
```

### agents.json

```json
{
  "$schema": "metrics/agents",
  "version": "1.0",
  "agents": {
    "backend-specialist": {
      "total_invocations": 45,
      "success_rate": 95.6,
      "average_retries": 1.3,
      "common_errors": [
        {
          "type": "ImportError",
          "count": 5,
          "resolution": "Check import paths"
        },
        {
          "type": "TypeError",
          "count": 3,
          "resolution": "Verify type hints"
        }
      ],
      "performance": {
        "average_duration_seconds": 180,
        "fastest": 45,
        "slowest": 450
      }
    },
    "frontend-specialist": {
      "total_invocations": 38,
      "success_rate": 97.4,
      "average_retries": 1.1,
      "common_errors": [
        {
          "type": "TypeScript Error",
          "count": 2,
          "resolution": "Fix type definitions"
        }
      ]
    },
    "test-specialist": {
      "total_invocations": 52,
      "success_rate": 98.1,
      "average_retries": 1.0
    }
  }
}
```

---

## 비용 메트릭

### tokens.json

```json
{
  "$schema": "metrics/tokens",
  "version": "1.0",
  "sessions": [
    {
      "session_id": "2025-01-17-001",
      "date": "2025-01-17",
      "total_tokens": 125000,
      "input_tokens": 95000,
      "output_tokens": 30000,
      "by_phase": {
        "phase_0": {
          "tokens": 35000,
          "percentage": 28,
          "tasks": ["T0.1", "T0.2", "T0.5.1", "T0.5.2"]
        },
        "phase_1": {
          "tokens": 50000,
          "percentage": 40,
          "tasks": ["T1.1", "T1.2"]
        },
        "phase_2": {
          "tokens": 40000,
          "percentage": 32,
          "tasks": ["T2.1", "T2.2"]
        }
      },
      "by_agent": {
        "orchestrator": 15000,
        "backend-specialist": 45000,
        "frontend-specialist": 38000,
        "test-specialist": 27000
      },
      "estimated_cost_usd": 1.88
    }
  ],
  "summary": {
    "total_tokens_all_time": 580000,
    "average_per_session": 116000,
    "trend": "stable"
  }
}
```

---

## 일간 리포트 템플릿

### reports/YYYY-MM-DD.md

```markdown
# 평가 리포트: 2025-01-17

## 세션 정보
- **시작**: 09:00:00
- **종료**: 12:30:00
- **총 소요 시간**: 3시간 30분

---

## 📊 코드 품질

### 커버리지
| 유형 | 값 | 기준 | 상태 |
|------|-----|------|------|
| 라인 | 75.5% | ≥70% | ✅ |
| 브랜치 | 68.2% | ≥60% | ✅ |
| 함수 | 82.1% | ≥70% | ✅ |

### 복잡도 경고
| 파일 | 함수 | 복잡도 | 권장 |
|------|------|--------|------|
| auth_service.py | authenticate | 12 | 리팩토링 권장 |

### 보안
- Critical: 0 ✅
- High: 0 ✅
- Medium: 1 (수정됨)

---

## 🤖 에이전트 성능

| 에이전트 | 태스크 | 성공률 | 평균 재시도 |
|----------|--------|--------|------------|
| backend-specialist | 4 | 100% | 1.5회 |
| frontend-specialist | 3 | 100% | 1.0회 |
| test-specialist | 5 | 100% | 1.0회 |

### 첫 시도 성공률: 75% (6/8 태스크)

---

## 💰 비용

| 항목 | 값 |
|------|-----|
| 총 토큰 | 125,000 |
| 예상 비용 | $1.88 |

### Phase별 비용 분포
```
Phase 0: ████████ 28%
Phase 1: ████████████ 40%
Phase 2: ██████████ 32%
```

---

## 🎯 개선 권장사항

1. **복잡도 개선**
   - `auth_service.py:authenticate()` - 검증 로직 분리 권장

2. **커버리지 향상**
   - `app/services/auth_service.py` 72% → 목표 85%
   - 미커버 라인: 45-52, 78-85

3. **비용 최적화**
   - Phase 0 토큰 사용량 28% → 20% 목표
   - 스키마 정의 캐싱 고려
```
