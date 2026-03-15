# 화면 명세 YAML 스키마 v2.0

> "화면이 주도하되, 도메인이 방어한다"
> 화면은 "무엇이 필요한지"만 선언, 백엔드는 "어떻게 제공할지" 독립적으로 결정

---

## 핵심 변경 (v1.0 → v2.0)

| 영역 | v1.0 | v2.0 |
|------|------|------|
| **API 정의** | `api.endpoint`, `api.request`, `api.response` | `data_requirements` + `data_source.resource` |
| **레이아웃** | `width: 250px`, `height: 100%` | `position: main`, `layout: sidebar-main` |
| **통합 테스트** | `integration_tests` (12+개) | `tests` (3-5개 필수 시나리오만) |
| **파일 크기** | 400줄/화면 | **100줄/화면** 목표 |

---

## 최상위 구조

```yaml
version: "2.0"               # 스키마 버전 (필수)
screen:                      # 화면 기본 정보 (필수)
data_requirements:           # 화면이 필요로 하는 데이터 (필수) ⭐ NEW
components:                  # 컴포넌트 목록 (필수)
connections:                 # 다른 화면/기능과의 연결점 (필수)
tests:                       # 통합 테스트 시나리오 (필수, 3-5개)
design_reference:            # Stitch MCP 연동 결과 (선택, 자동 생성) ⭐ NEW
notes:                       # 추가 메모 (선택)
```

---

## screen (화면 기본 정보)

```yaml
screen:
  name: string              # 화면 이름 (필수)
  route: string             # URL 경로 (필수)
  layout: string            # 레이아웃 타입 (필수)
  auth: boolean             # 인증 필요 여부 (선택, 기본: false)
  roles: string[]           # 접근 가능한 역할 (선택)
```

### layout 타입

| 타입 | 설명 |
|------|------|
| `full-width` | 전체 너비 (헤더/푸터만) |
| `sidebar-main` | 사이드바 + 메인 |
| `main-sidebar` | 메인 + 사이드바 |
| `dashboard` | 대시보드 (사이드 네비게이션 + 메인) |

---

## data_requirements (화면 데이터 요구사항) ⭐ NEW

화면이 필요로 하는 데이터를 **리소스 참조**로 선언합니다.
API 세부 사항(endpoint, request/response)은 `specs/domain/resources.yaml`에서 관리합니다.

```yaml
data_requirements:
  - resource: products           # 참조할 리소스 이름
    needs: [id, name, price, thumbnail]  # 필요한 필드
    filters:                     # 필터 조건 (선택)
      category: "?category"      # URL 파라미터 참조
      page: "?page"

  - resource: categories
    needs: [id, name, slug, product_count]

  - resource: wishlist
    needs: [product_id]
    auth_required: true          # 인증 필요 리소스
```

### data_requirements 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `resource` | ✅ | `specs/domain/resources.yaml`에 정의된 리소스 이름 |
| `needs` | ✅ | 화면에서 사용하는 필드 목록 |
| `filters` | - | URL 파라미터 또는 고정값 필터 |
| `auth_required` | - | 인증이 필요한 리소스인지 (기본: false) |

---

## components (컴포넌트 목록)

> **간소화**: `api` 섹션 제거, `data_source.resource` 참조로 대체

```yaml
components:
  - id: string              # 고유 ID (필수, snake_case)
    type: string            # 컴포넌트 타입 (필수)
    position: string        # 위치 (필수) - sidebar, main, header, footer
    function: string        # 기능 설명 (필수)

    # 데이터 소스 (api 대체) ⭐ NEW
    data_source:
      resource: products    # data_requirements의 리소스 참조

    # 이벤트 (필수, 최소 1개)
    events:
      - on: string          # 트리거 (click, scroll:end, submit 등)
        do: string          # 수행할 동작 설명
```

### position 값

| 값 | 설명 |
|------|------|
| `header` | 상단 헤더 영역 |
| `sidebar` | 사이드바 영역 |
| `main` | 메인 콘텐츠 영역 |
| `footer` | 하단 푸터 영역 |
| `overlay` | 오버레이/모달 |

### type 값

| 타입 | 설명 |
|------|------|
| `navigation` | 네비게이션/필터 |
| `grid` | 그리드 레이아웃 |
| `list` | 리스트 레이아웃 |
| `card` | 카드 컴포넌트 |
| `form` | 입력 폼 |
| `detail` | 상세 정보 표시 |

---

## connections (연결점)

```yaml
connections:
  navigations:
    - from: product_card      # 출발 컴포넌트 ID
      to: /products/:id       # 도착 화면 route

  shared_components:
    - header
    - footer

  external:                   # 외부 서비스 연결
    - auth                    # 인증 서비스
```

---

## tests (통합 테스트) ⭐ 간소화

> **3-5개 핵심 시나리오만 정의** (기존 12개+ → 축소)

```yaml
tests:
  - name: string              # 테스트 이름 (필수)
    when: string              # 사용자 액션 (필수)
    then: string[]            # 예상 결과 (필수, 최소 1개)
```

### 예시

```yaml
tests:
  - name: 초기 로드
    when: 페이지 접속
    then:
      - 상품 12개 표시
      - 카테고리 사이드바 표시

  - name: 카테고리 필터링
    when: 전자제품 카테고리 클릭
    then:
      - URL이 ?category=electronics로 변경
      - 해당 카테고리 상품만 표시

  - name: 상품 상세 이동
    when: 상품 카드 클릭
    then:
      - /products/:id로 이동
```

---

## 전체 예시 (~95줄)

```yaml
version: "2.0"

screen:
  name: 상품 목록
  route: /products
  layout: sidebar-main
  auth: false

data_requirements:
  - resource: products
    needs: [id, name, price, thumbnail]
    filters:
      category: "?category"
      page: "?page"
      sort: "?sort"

  - resource: categories
    needs: [id, name, slug, product_count]

  - resource: wishlist
    needs: [product_id]
    auth_required: true

components:
  - id: category_sidebar
    type: navigation
    position: sidebar
    function: 카테고리별 상품 필터링
    data_source:
      resource: categories
    events:
      - on: click:category
        do: 선택한 카테고리로 필터링, URL 업데이트

  - id: product_grid
    type: grid
    position: main
    function: 상품 카드 그리드 표시
    data_source:
      resource: products
    events:
      - on: scroll:end
        do: 다음 페이지 로드 (무한 스크롤)

  - id: product_card
    type: card
    position: main
    function: 개별 상품 정보 표시
    data_source:
      resource: products
    events:
      - on: click:card
        do: 상품 상세 페이지로 이동
      - on: click:wishlist
        do: 위시리스트 토글 (로그인 필요)

connections:
  navigations:
    - from: product_card
      to: /products/:id

  shared_components:
    - header
    - footer

  external:
    - auth

tests:
  - name: 초기 로드
    when: 페이지 접속
    then:
      - 상품 12개 표시
      - 카테고리 사이드바 표시

  - name: 카테고리 필터링
    when: 전자제품 카테고리 클릭
    then:
      - URL이 ?category=electronics로 변경
      - 해당 카테고리 상품만 표시

  - name: 상품 상세 이동
    when: 상품 카드 클릭
    then:
      - /products/:id로 이동

  - name: 찜하기 (비로그인)
    when: 비로그인 상태에서 찜하기 클릭
    then:
      - 로그인 모달 표시

  - name: 무한 스크롤
    when: 스크롤 끝 도달
    then:
      - 다음 12개 상품 추가 로드
```

---

## 필수 vs 선택 필드 요약

| 섹션 | 필드 | 필수 여부 |
|------|------|----------|
| `version` | - | 필수 ("2.0") |
| `screen` | name, route, layout | 필수 |
| `screen` | auth, roles | 선택 |
| `data_requirements` | resource, needs | 필수 |
| `data_requirements` | filters, auth_required | 선택 |
| `components` | id, type, position, function, events | 필수 |
| `components` | data_source | 선택 (데이터 필요 시 필수) |
| `connections` | navigations | 필수 (이동이 있는 경우) |
| `tests` | name, when, then | 필수 (3-5개) |

---

## v1.0에서 v2.0으로 마이그레이션

### Before (v1.0)

```yaml
components:
  - id: product_grid
    layout:
      position: main
      width: 100%
      columns:
        sm: 2
        md: 3
    api:
      endpoint: GET /api/products
      request:
        type: object
        fields:
          category: string
          page: number
      response:
        type: object
        fields:
          products: Product[]
          total: number
```

### After (v2.0)

```yaml
data_requirements:
  - resource: products
    needs: [id, name, price, thumbnail]
    filters: { category: "?category", page: "?page" }

components:
  - id: product_grid
    type: grid
    position: main
    function: 상품 카드 그리드 표시
    data_source:
      resource: products
```

**핵심 차이:**
- API 세부사항 → `specs/domain/resources.yaml`로 이동
- 화면은 "무엇이 필요한지"만 선언
- 백엔드는 리소스 스키마에서 독립적으로 관리

---

## design_reference (Stitch MCP 연동) ⭐ NEW

> Google Stitch MCP를 통해 생성된 디자인 목업 정보를 저장합니다.
> 이 섹션은 `/screen-spec` Phase 5에서 **자동 생성**됩니다.

```yaml
design_reference:
  stitch_project_id: string     # Stitch 프로젝트 ID
  screen_id: string             # Stitch 화면 ID
  image: string                 # 목업 이미지 경로 (design/screens/*.png)
  html: string                  # HTML 코드 경로 (design/html/*.html)
  stitch_url: string            # Stitch 웹 URL (직접 편집용)
  generated_at: string          # 생성 시간 (ISO 8601)
  accessibility_score: number   # WCAG 2.1 접근성 점수 (0-100)
  design_tokens_applied: boolean # 디자인 토큰 적용 여부
```

### design_reference 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `stitch_project_id` | ✅ | Google Stitch 프로젝트 ID |
| `screen_id` | ✅ | Stitch 내 화면 ID |
| `image` | ✅ | 생성된 목업 이미지 상대 경로 |
| `html` | - | 생성된 HTML 코드 상대 경로 |
| `stitch_url` | - | Stitch 웹에서 직접 편집 가능한 URL |
| `generated_at` | ✅ | 생성 시간 (자동) |
| `accessibility_score` | - | WCAG 2.1 접근성 검사 점수 |
| `design_tokens_applied` | - | 디자인 시스템 토큰 적용 여부 |

### 예시

```yaml
design_reference:
  stitch_project_id: "proj_abc123"
  screen_id: "screen_xyz789"
  image: "design/screens/product-list.png"
  html: "design/html/product-list.html"
  stitch_url: "https://stitch.withgoogle.com/p/proj_abc123/s/screen_xyz789"
  generated_at: "2026-01-27T10:30:00Z"
  accessibility_score: 92
  design_tokens_applied: true
```

### Stitch 연동 워크플로우

```
1. YAML 명세 작성 완료
   └── screen, data_requirements, components, tests

2. /screen-spec Phase 5: Stitch 연동
   ├── YAML → Stitch 프롬프트 변환
   ├── mcp__stitch__generate_screen_from_text 호출
   ├── mcp__stitch__fetch_screen_image 호출
   ├── mcp__stitch__fetch_screen_code 호출
   └── mcp__stitch__analyze_accessibility 호출

3. design_reference 자동 추가
   └── 생성된 정보가 YAML에 기록됨

4. /tasks-generator
   └── Frontend Task에 design_reference 포함
```

### 관련 문서

- [Stitch 프롬프트 빌더](./stitch-prompt-builder.md)
- [Stitch MCP 연동 가이드](./stitch-integration.md)
