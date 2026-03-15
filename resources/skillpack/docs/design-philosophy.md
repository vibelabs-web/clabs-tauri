# Screen-Driven, Domain-Guarded 설계 철학

> "화면이 주도하되, 도메인이 방어한다"
> Screen-Driven Development의 Coupling Trap을 방지하는 설계 원칙

---

## 문제: Screen-Driven의 Coupling Trap

Screen-Driven Development(화면 중심 개발)는 사용자 경험을 먼저 정의하고, 백엔드를 나중에 구현하는 방식입니다. 이 접근법은 **직관적**이지만, 심각한 문제를 유발합니다:

### Coupling Trap이란?

```
화면 명세가 API를 직접 정의할 때:

product-list.yaml:
  components:
    - id: product_grid
      api:
        endpoint: GET /api/screens/product-list  ← 화면명이 URL에!
        response:
          price: "10,000원"  ← 포맷된 응답!

결과:
- 백엔드가 화면에 종속됨
- 화면 변경 시 API도 변경 필요
- 같은 데이터를 여러 화면에서 사용할 때 중복 API 생성
- 재사용 불가능한 API 구조
```

### 핵심 원칙

> **화면은 '데이터의 수요자(Consumer)'일 뿐,**
> **'공급자(Provider)'의 구조를 결정할 수 없다.**

화면은 "무엇이 필요한지"만 선언하고,
백엔드는 "어떻게 제공할지" 독립적으로 결정해야 합니다.

---

## 해결: Domain Guard 3대 전략

### 전략 1: 메뉴(Domain)와 주문(Screen) 분리

식당에서 손님(화면)은 메뉴판(Domain Resources)에 있는 것만 주문할 수 있습니다.
새로운 요리를 주문하려면 먼저 메뉴판에 추가되어야 합니다.

```yaml
# 메뉴판: specs/domain/resources.yaml
resources:
  products:
    endpoints:
      - method: GET
        path: /api/products
    fields:
      id: { type: uuid }
      name: { type: string }
      price: { type: number }      # 숫자! "10,000원" 아님
      thumbnail: { type: string }

# 주문서: specs/screens/product-list.yaml
data_requirements:
  - resource: products            # 메뉴에 있는 것만 주문
    needs: [id, name, price, thumbnail]
```

**효과:**
- 화면은 존재하는 리소스만 참조 가능
- 백엔드는 화면과 독립적으로 API 설계
- 여러 화면이 같은 리소스 재사용

### 전략 2: 백엔드 헌법 (API Design Constitution)

백엔드 API의 불변 규칙을 정의합니다. 이 규칙은 어떤 상황에서도 위반할 수 없습니다.

#### 필수 규칙 (MUST)

| 규칙 | 올바른 예 | 잘못된 예 |
|------|----------|----------|
| RESTful 엔드포인트 | `/api/products` | `/api/screens/product-list` |
| 복수형 명사 | `/api/products` | `/api/product` |
| Raw 데이터 반환 | `price: 10000` | `price: "10,000원"` |
| 중첩 2단계 이하 | `/api/orders/:id/items` | `/api/users/:id/orders/:id/items` |

#### 금지 패턴 (NEVER)

```python
# ❌ 화면명 URL
@router.get("/api/screens/product-list")  # NEVER!

# ❌ 포맷된 응답
return {"price": "10,000원"}  # NEVER!

# ❌ 화면 전용 에러 메시지
raise HTTPException(detail="장바구니에 상품을 추가할 수 없습니다")  # NEVER!
# ✅ 대신
raise HTTPException(detail={"code": "INSUFFICIENT_STOCK", "stock": 0})
```

### 전략 3: Interface Contract 검증

화면 명세 → 태스크 생성 전에 자동 검증을 수행합니다.
검증 실패 시 태스크 생성이 중단됩니다.

#### 검증 항목

| 검증 | 내용 | 실패 시 |
|------|------|--------|
| **Field Coverage** | 화면이 필요한 필드가 리소스에 존재하는지 | 리소스 필드 추가 필요 |
| **Endpoint Existence** | 참조하는 리소스가 정의되어 있는지 | 리소스 정의 추가 필요 |
| **Auth Consistency** | 인증 요구사항이 일치하는지 | auth_required 수정 필요 |

#### 검증 흐름

```
/tasks-generator 실행
       ↓
Phase 0: Domain Resources 읽기
       ↓
Phase 1: Screen 명세 읽기
       ↓
Phase 2: Interface Contract Validation
       ├── Field Coverage 검증
       ├── Endpoint Existence 검증
       └── Auth Consistency 검증
       ↓
검증 실패? → 태스크 생성 중단! 수정 후 재실행
검증 통과? → 태스크 생성 진행
```

---

## 구현 구조

### 파일 구조

```
specs/
├── domain/
│   └── resources.yaml      # 메뉴판 (백엔드 리소스 정의)
└── screens/
    └── product-list.yaml   # 주문서 (화면 명세)

.claude/
├── constitutions/
│   ├── fastapi/
│   │   └── api-design.md   # FastAPI 헌법
│   └── nextjs/
│       └── api-design.md   # Next.js 헌법
└── skills/
    └── tasks-generator/
        └── references/
            └── domain-resource-validation.md  # 검증 규칙
```

### 태스크 구조 분리

```
기존 (Coupling Trap):
P2-S1-T1: 상품 목록 백엔드  ← 화면에 종속!
P2-S1-T2: 상품 목록 UI

개선 (Domain Guard):
P2-R1-T1: Products API     ← 리소스 독립!
P2-S1-T1: 상품 목록 UI     ← 화면은 리소스 참조만
```

---

## Before vs After

### Before: 화면 종속적 API

```yaml
# product-list.yaml (406줄)
components:
  - id: product_grid
    api:
      endpoint: GET /api/screens/product-list  # 화면명!
      request:
        fields:
          category: string
          page: number
      response:
        fields:
          products: Product[]
          price: "10,000원"  # 포맷된 값!
```

### After: 리소스 독립적 API

```yaml
# resources.yaml
resources:
  products:
    endpoints:
      - method: GET
        path: /api/products
    fields:
      price: { type: number }  # Raw 값!

# product-list.yaml (100줄)
data_requirements:
  - resource: products
    needs: [id, name, price, thumbnail]

components:
  - id: product_grid
    data_source: { resource: products }
```

---

## 요약

| 원칙 | 실천 |
|------|------|
| **화면이 주도** | Screen-Spec으로 화면 먼저 정의 |
| **도메인이 방어** | Domain Resources로 API 계약 고정 |
| **느슨한 결합** | `data_requirements`로 참조만 |
| **자동 검증** | Interface Contract Validation |

> **"화면이 주도하되(Screen-Driven), 도메인이 방어하는(Domain-Guarded)"**
>
> 이 원칙을 지키면:
> - 화면 변경 시 백엔드 수정 최소화
> - 여러 화면에서 같은 API 재사용
> - 프론트엔드/백엔드 병렬 개발 가능

---

## 관련 문서

- [Screen-Spec 스키마 v2.0](../skills/screen-spec/references/schema.md)
- [Domain Resources 스키마](../skills/screen-spec/references/domain-resources-schema.md)
- [Domain Resource Validation](../skills/tasks-generator/references/domain-resource-validation.md)
- [FastAPI API Design 헌법](../constitutions/fastapi/api-design.md)
- [Next.js API Design 헌법](../constitutions/nextjs/api-design.md)
- [화면 단위 태스크 생성 규칙 v2.0](../skills/tasks-generator/references/screen-based-tasks.md)
