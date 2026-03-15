# Stitch 프롬프트 빌더

> YAML 화면 명세를 Google Stitch 최적화 프롬프트로 변환하는 규칙

---

## 개요

화면 명세 YAML을 분석하여 Stitch AI가 이해할 수 있는 자연어 프롬프트를 생성합니다.
디자인 시스템 문서(`05-design-system.md`)의 색상, 타이포그래피, 간격 정보를 함께 적용합니다.

---

## 프롬프트 구조

```
[Screen Description]
{화면 이름}을(를) 위한 {레이아웃} 레이아웃의 UI를 생성해주세요.

[Layout Structure]
{레이아웃 설명}

[Components]
{컴포넌트별 설명}

[Design System]
{디자인 시스템 정보}

[Interactions]
{주요 인터랙션}

[Additional Context]
{추가 컨텍스트}
```

---

## 변환 규칙

### 1. Screen → Screen Description

```yaml
# 입력
screen:
  name: 상품 목록
  route: /products
  layout: sidebar-main
```

```
# 출력
Create a product listing page with sidebar-main layout.
This is the main shopping interface where users browse products.
```

### 2. Layout → Layout Structure

| YAML layout | Stitch 프롬프트 |
|-------------|-----------------|
| `full-width` | "Full-width layout with header at top and footer at bottom. Main content spans entire width." |
| `sidebar-main` | "Two-column layout: left sidebar (250px) for navigation/filters, main content area on right." |
| `main-sidebar` | "Two-column layout: main content area on left, right sidebar (300px) for supplementary info." |
| `dashboard` | "Dashboard layout: left navigation panel (60px collapsed, 250px expanded), top header bar, main content grid." |

### 3. Components → Component Descriptions

```yaml
# 입력
components:
  - id: category_sidebar
    type: navigation
    position: sidebar
    function: 카테고리별 상품 필터링
    data_source:
      resource: categories
```

```
# 출력
LEFT SIDEBAR:
- Category Navigation: Vertical list of product categories with:
  - Category name and product count badge
  - Active state highlighting
  - Collapsible subcategories
  - Filter functionality
```

#### 컴포넌트 타입별 프롬프트 템플릿

| type | 프롬프트 템플릿 |
|------|----------------|
| `navigation` | "Navigation menu with {items}. Include active state, hover effects, and clear visual hierarchy." |
| `grid` | "Responsive grid layout showing {items} per row (desktop: 4, tablet: 2, mobile: 1)." |
| `list` | "Vertical list with {items}. Each item shows {fields}." |
| `card` | "Card component with {image position}, {title}, {subtitle}, and {actions}." |
| `form` | "Form with {fields}. Include validation states, error messages, and submit button." |
| `detail` | "Detail view showing {main info} with {supporting info} sections." |

### 4. Design System → Style Instructions

```yaml
# 입력 (05-design-system.md에서 추출)
colors:
  primary: "#3B82F6"
  primary_light: "#60A5FA"
  surface: "#F8FAFC"
  text_primary: "#1E293B"

typography:
  font_family: "Pretendard"
  scale:
    h1: "28px"
    body: "14px"

spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
```

```
# 출력
DESIGN SYSTEM:
- Primary color: Blue (#3B82F6) for buttons, links, and accents
- Light primary: Soft blue (#60A5FA) for hover states and backgrounds
- Surface color: Near-white (#F8FAFC) for cards and containers
- Text: Dark slate (#1E293B) for readability
- Font: Pretendard, clean sans-serif
- Spacing scale: 8px base unit (8, 16, 24px)
- Style: Modern, clean, with subtle shadows and rounded corners (8px)
```

### 5. Events → Interaction Notes

```yaml
# 입력
events:
  - on: click:card
    do: 상품 상세 페이지로 이동
  - on: scroll:end
    do: 다음 페이지 로드 (무한 스크롤)
```

```
# 출력
INTERACTIONS:
- Product cards are clickable, navigating to product detail page
- Implement infinite scroll - load more products when reaching bottom
- Add loading skeleton during data fetch
```

---

## 전체 변환 예시

### 입력: product-list.yaml

```yaml
version: "2.0"

screen:
  name: 상품 목록
  route: /products
  layout: sidebar-main

data_requirements:
  - resource: products
    needs: [id, name, price, thumbnail]
  - resource: categories
    needs: [id, name, slug, product_count]

components:
  - id: category_sidebar
    type: navigation
    position: sidebar
    function: 카테고리별 상품 필터링
    data_source:
      resource: categories
    events:
      - on: click:category
        do: 선택한 카테고리로 필터링

  - id: product_grid
    type: grid
    position: main
    function: 상품 카드 그리드 표시
    data_source:
      resource: products
    events:
      - on: scroll:end
        do: 다음 페이지 로드
```

### 입력: 05-design-system.md (일부)

```markdown
## 컬러 팔레트
- Primary: #3B82F6 (Blue)
- Surface: #F8FAFC
- Text Primary: #1E293B

## 타이포그래피
- Font: Pretendard

## 간격
- Base: 8px
```

### 출력: Stitch 프롬프트

```
Create a product listing page for an e-commerce application.

LAYOUT:
Two-column layout with a 250px left sidebar and flexible main content area.
Header spans full width at top.

LEFT SIDEBAR:
Category Navigation - Vertical list of product categories featuring:
- Category name with product count badge on the right
- Subtle hover effect (background: #F1F5F9)
- Active state with primary color (#3B82F6) left border and bold text
- Clean spacing between items (12px vertical gap)

MAIN CONTENT AREA:
Product Grid displaying cards in responsive layout:
- Desktop: 4 columns
- Tablet: 2 columns
- Mobile: 1 column
- 16px gap between cards

PRODUCT CARD DESIGN:
Each card contains:
- Product image (aspect ratio 4:3, rounded corners 8px)
- Product name (14px, semibold, #1E293B, max 2 lines)
- Price (16px, bold, #3B82F6)
- Wishlist icon button (top-right corner)
- Subtle shadow on hover, slight scale transform (1.02)

DESIGN SYSTEM:
- Primary color: #3B82F6 (used for CTAs, active states, prices)
- Surface: #F8FAFC (card backgrounds)
- Text: #1E293B (primary text), #64748B (secondary)
- Font: Pretendard, system-ui fallback
- Border radius: 8px for cards, 4px for buttons
- Shadows: subtle (0 2px 4px rgba(0,0,0,0.05))

INTERACTIONS:
- Cards are fully clickable (navigate to product detail)
- Infinite scroll - show skeleton loaders when fetching
- Category click filters products with smooth transition

ACCESSIBILITY:
- Ensure 4.5:1 contrast ratio for all text
- Focusable cards with visible focus ring
- Proper heading hierarchy
```

---

## 프롬프트 생성 함수

```python
def build_stitch_prompt(yaml_spec: dict, design_system: dict) -> str:
    """
    YAML 화면 명세와 디자인 시스템 정보를 Stitch 프롬프트로 변환

    Args:
        yaml_spec: 파싱된 YAML 화면 명세
        design_system: 파싱된 디자인 시스템 정보

    Returns:
        Stitch AI에 전달할 프롬프트 문자열
    """
    prompt_parts = []

    # 1. Screen Description
    screen = yaml_spec['screen']
    prompt_parts.append(f"Create a {screen['name']} page for an application.")

    # 2. Layout Structure
    layout_desc = LAYOUT_TEMPLATES[screen['layout']]
    prompt_parts.append(f"\nLAYOUT:\n{layout_desc}")

    # 3. Components
    for component in yaml_spec['components']:
        comp_desc = generate_component_description(component)
        prompt_parts.append(f"\n{component['position'].upper()}:\n{comp_desc}")

    # 4. Design System
    ds_desc = generate_design_system_description(design_system)
    prompt_parts.append(f"\nDESIGN SYSTEM:\n{ds_desc}")

    # 5. Interactions
    interactions = extract_interactions(yaml_spec['components'])
    prompt_parts.append(f"\nINTERACTIONS:\n{interactions}")

    # 6. Accessibility (항상 포함)
    prompt_parts.append("""
ACCESSIBILITY:
- Ensure 4.5:1 contrast ratio for all text
- Focusable interactive elements with visible focus ring
- Proper heading hierarchy
- Screen reader compatible
""")

    return "\n".join(prompt_parts)
```

---

## 컨텍스트 적용

### 기존 디자인 컨텍스트 활용

동일 프로젝트 내 다른 화면이 이미 생성된 경우:

```python
# 첫 번째 화면 생성 후 디자인 컨텍스트 추출
context = mcp__stitch__extract_design_context(
    screen_id=first_screen_id
)

# 이후 화면에 동일 컨텍스트 적용
mcp__stitch__apply_design_context(
    project_id=project_id,
    screen_id=new_screen_id,
    context=context
)
```

### 프롬프트에 컨텍스트 명시

```
This screen is part of the same application as [첫 번째 화면 이름].
Maintain visual consistency with:
- Same color palette
- Same typography scale
- Same spacing system
- Same component styling (buttons, cards, inputs)
```

---

## 관련 문서

- [화면 명세 스키마 v2.0](./schema.md)
- [Stitch MCP 연동 가이드](./stitch-integration.md)
- [디자인 시스템 템플릿](../../socrates/references/design-system-template.md)
