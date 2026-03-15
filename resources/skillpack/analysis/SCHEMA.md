# Analysis JSON Schema Documentation

> `.claude/analysis/` 디렉토리에 저장되는 JSON 파일의 스키마 정의

## 디렉토리 구조

```
.claude/analysis/
├── SCHEMA.md              # 이 문서
├── architecture.json      # 아키텍처 분석 결과
├── requirements.json      # 요구사항 분석 결과
├── system-design.json     # 시스템 설계 결과
├── api-design.json        # API 설계 결과
└── impact.json            # 영향 분석 결과
```

---

## 1. architecture.json

**생성 에이전트:** `architecture-analyst`

```json
{
  "version": "1.0",
  "analyzed_at": "2026-01-23T10:00:00Z",

  "tech_stack": {
    "backend": {
      "language": "python",
      "framework": "fastapi",
      "version": "0.109.0"
    },
    "frontend": {
      "language": "typescript",
      "framework": "react",
      "version": "18.2.0"
    },
    "database": "postgresql",
    "orm": "sqlalchemy"
  },

  "structure": {
    "type": "monorepo | polyrepo | single",
    "root_dirs": ["backend", "frontend", "shared"],
    "config_files": ["pyproject.toml", "package.json"]
  },

  "architecture": {
    "pattern": "3-tier | clean | ddd | mvc | cqrs",
    "layers": {
      "api": "backend/app/api/",
      "service": "backend/app/services/",
      "data": "backend/app/models/"
    }
  },

  "domains": [
    {
      "name": "auth",
      "path": "backend/app/api/routes/auth.py",
      "responsibilities": ["login", "register", "token"]
    }
  ],

  "dependencies": {
    "external_apis": [],
    "message_queues": [],
    "caching": []
  }
}
```

---

## 2. requirements.json

**생성 에이전트:** `requirements-analyst`

```json
{
  "version": "1.0",
  "analyzed_at": "2026-01-23T10:00:00Z",
  "source": "user_request | file",

  "summary": {
    "functional_count": 5,
    "non_functional_count": 3,
    "risk_count": 2,
    "priority_order": ["auth", "profile", "social"]
  },

  "functional_requirements": [
    {
      "id": "FR1",
      "title": "이메일/비밀번호 로그인",
      "description": "사용자가 이메일과 비밀번호로 로그인할 수 있어야 한다",
      "priority": "must | should | could | wont",
      "domain": "auth",
      "acceptance_criteria": [
        "유효한 이메일/비밀번호 입력 시 로그인 성공",
        "잘못된 정보 입력 시 에러 메시지 표시"
      ]
    }
  ],

  "non_functional_requirements": [
    {
      "id": "NFR1",
      "category": "performance | security | scalability | usability",
      "title": "로그인 응답 시간",
      "metric": "< 500ms (p95)"
    }
  ],

  "risks": [
    {
      "id": "RISK1",
      "title": "OAuth 설정 복잡성",
      "description": "소셜 로그인 OAuth 콜백 URL 및 앱 등록 필요",
      "mitigation": "개발 환경에서 localhost 콜백 테스트",
      "severity": "low | medium | high | critical"
    }
  ],

  "assumptions": ["PostgreSQL 데이터베이스 사용"],
  "out_of_scope": ["2FA (Two-Factor Authentication)"],

  "dependencies": {
    "external": [
      {"name": "Google OAuth", "required_for": "FR3"}
    ],
    "internal": []
  }
}
```

---

## 3. system-design.json

**생성 에이전트:** `system-designer`

```json
{
  "version": "1.0",
  "designed_at": "2026-01-23T10:00:00Z",

  "summary": {
    "domains": ["auth"],
    "total_services": 3,
    "total_apis": 5,
    "total_tables": 2,
    "design_patterns": ["repository", "strategy"]
  },

  "domains": {
    "auth": {
      "description": "사용자 인증/인가 도메인",

      "entities": [
        {
          "name": "User",
          "type": "aggregate_root | entity | value_object",
          "attributes": [
            {
              "name": "id",
              "type": "UUID",
              "primary_key": true
            },
            {
              "name": "email",
              "type": "Email",
              "unique": true
            }
          ]
        }
      ],

      "services": [
        {
          "name": "AuthService",
          "responsibility": "인증 비즈니스 로직",
          "methods": [
            {
              "name": "login",
              "params": ["email: str", "password: str"],
              "returns": "AuthResponse",
              "raises": ["InvalidCredentials"]
            }
          ],
          "dependencies": ["UserRepository", "TokenService"]
        }
      ],

      "apis": [
        {
          "method": "POST | GET | PUT | PATCH | DELETE",
          "path": "/auth/login",
          "request_body": "LoginRequest",
          "response": "AuthResponse",
          "errors": [400, 401, 409]
        }
      ],

      "database": {
        "tables": [
          {
            "name": "users",
            "columns": [
              {
                "name": "id",
                "type": "UUID",
                "constraints": ["PRIMARY KEY"]
              }
            ],
            "indexes": [
              {
                "name": "idx_users_email",
                "columns": ["email"],
                "unique": true
              }
            ]
          }
        ]
      },

      "patterns": [
        {
          "name": "repository",
          "applied_to": "UserRepository",
          "reason": "데이터 접근 추상화"
        }
      ],

      "risks": [
        {
          "id": "DR1",
          "title": "OAuth 복잡성",
          "description": "다중 제공자 지원으로 인한 복잡도 증가",
          "mitigation": "Strategy 패턴으로 제공자별 로직 분리"
        }
      ]
    }
  },

  "cross_cutting": {
    "error_handling": {
      "strategy": "exception-based",
      "common_errors": [
        {"code": 400, "name": "BadRequest"}
      ]
    },
    "logging": {
      "framework": "structlog",
      "levels": ["DEBUG", "INFO", "WARNING", "ERROR"]
    },
    "security": {
      "password_hashing": "bcrypt",
      "token_type": "JWT"
    }
  },

  "file_structure": {
    "backend/app/": {
      "api/routes/auth.py": "API 엔드포인트",
      "services/auth_service.py": "AuthService"
    }
  }
}
```

---

## 4. api-design.json

**생성 에이전트:** `api-designer`

```json
{
  "version": "1.0",
  "designed_at": "2026-01-23T10:00:00Z",

  "summary": {
    "domains": ["auth"],
    "total_endpoints": 5,
    "total_schemas": 4,
    "total_errors": 3
  },

  "domains": {
    "auth": {
      "base_path": "/auth",
      "description": "인증/인가 API",

      "endpoints": [
        {
          "method": "POST",
          "path": "/auth/login",
          "summary": "로그인",
          "request": {
            "body": "LoginRequest",
            "content_type": "application/json"
          },
          "response": {
            "status": 200,
            "body": "AuthResponse"
          },
          "errors": [
            {"status": 401, "description": "Invalid credentials"}
          ],
          "tags": ["auth"],
          "auth_required": false
        }
      ],

      "schemas": {
        "LoginRequest": {
          "type": "object",
          "properties": {
            "email": {"type": "string", "format": "email"},
            "password": {"type": "string"}
          },
          "required": ["email", "password"]
        },
        "AuthResponse": {
          "type": "object",
          "properties": {
            "user": {"$ref": "#/schemas/UserResponse"},
            "token": {"$ref": "#/schemas/TokenPair"}
          }
        }
      },

      "error_codes": {
        "400": "Bad Request",
        "401": "Unauthorized",
        "409": "Conflict"
      }
    }
  },

  "conventions": {
    "naming": {
      "endpoints": "kebab-case",
      "schemas": "PascalCase",
      "fields": "snake_case"
    },
    "versioning": "URL prefix (/api/v1/)",
    "pagination": {
      "style": "cursor | offset",
      "params": ["cursor", "limit"]
    },
    "datetime_format": "ISO 8601"
  },

  "generated_files": [
    "contracts/auth.contract.ts",
    "backend/app/schemas/auth.py"
  ]
}
```

---

## 5. impact.json

**생성 에이전트:** `impact-analyzer`

```json
{
  "version": "1.0",
  "analyzed_at": "2026-01-23T10:00:00Z",
  "target": "backend/app/services/auth_service.py",

  "summary": {
    "affected_files": 12,
    "affected_tests": 5,
    "risk_level": "low | medium | high | critical",
    "recommended_tests": [
      "test_auth_service.py",
      "test_auth.py"
    ]
  },

  "target_analysis": {
    "file": "backend/app/services/auth_service.py",
    "module": "backend.app.services.auth_service",
    "exports": ["AuthService", "login", "register"],
    "lines_of_code": 150,
    "complexity": "low | medium | high"
  },

  "dependency_graph": {
    "direct_dependents": [
      {
        "file": "backend/app/api/routes/auth.py",
        "imports": ["AuthService"],
        "type": "direct"
      }
    ],
    "indirect_dependents": [
      {
        "file": "backend/app/main.py",
        "through": "routes/auth.py",
        "type": "indirect"
      }
    ],
    "total_depth": 3
  },

  "test_mapping": [
    {
      "test_file": "backend/tests/services/test_auth_service.py",
      "type": "unit | integration | e2e",
      "coverage": ["AuthService.login", "AuthService.register"],
      "priority": "high | medium | low"
    }
  ],

  "risk_assessment": {
    "level": "medium",
    "factors": [
      {
        "factor": "핵심 인증 모듈",
        "weight": "high"
      },
      {
        "factor": "테스트 커버리지 존재",
        "weight": "mitigating"
      }
    ],
    "recommendation": "단위 테스트 + 통합 테스트 실행 필수"
  },

  "suggested_actions": [
    {
      "action": "run_tests",
      "command": "pytest backend/tests/services/test_auth_service.py -v",
      "priority": "high"
    },
    {
      "action": "type_check",
      "command": "mypy backend/app/services/auth_service.py",
      "priority": "medium"
    }
  ]
}
```

---

## 파일 라이프사이클

### 생성 시점

| 파일 | 생성 에이전트 | 생성 조건 |
|------|-------------|----------|
| `architecture.json` | architecture-analyst | `ANALYZE_CODEBASE` 실행 |
| `requirements.json` | requirements-analyst | `REQ_ANALYZE` 실행 |
| `system-design.json` | system-designer | `DESIGN_SYSTEM` 실행 |
| `api-design.json` | api-designer | `DESIGN_API` 실행 |
| `impact.json` | impact-analyzer | `ANALYZE_IMPACT` 실행 |

### 업데이트 정책

- **덮어쓰기**: 같은 명령 재실행 시 기존 파일 덮어씀
- **증분 업데이트**: 도메인 추가 시 기존 도메인 유지 (예정)
- **버전 관리**: `version` 필드로 스키마 버전 추적

### 삭제 정책

- 수동 삭제만 허용
- 프로젝트 초기화 시 `.claude/analysis/` 전체 삭제 가능

---

## 검증 규칙

### 필수 필드

모든 JSON 파일은 다음 필드 필수:

```json
{
  "version": "1.0",
  "analyzed_at": "ISO 8601 datetime"
}
```

### 타입 검증

| 필드 | 타입 | 제약 |
|------|------|------|
| `version` | string | 시맨틱 버전 |
| `*_at` | string | ISO 8601 |
| `*_count` | integer | >= 0 |
| `risk_level` | enum | low, medium, high, critical |
| `priority` | enum | must, should, could, wont |
