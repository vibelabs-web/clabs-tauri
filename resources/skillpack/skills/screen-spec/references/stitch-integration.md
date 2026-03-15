# Google Stitch MCP 연동 가이드

> YAML 화면 명세 → Stitch 디자인 생성 → 프로젝트 반영 자동화

---

## ⚠️ 필수 옵션 요약 (반드시 확인!)

> **문제**: Stitch가 저해상도 이미지만 생성하거나 HTML을 생성하지 않는 경우

### 이미지 추출 - 고해상도 필수

```python
# ❌ 잘못된 사용 (저해상도)
mcp__stitch__fetch_screen_image(screen_id=id)  # scale 미지정

# ✅ 올바른 사용 (고해상도)
mcp__stitch__fetch_screen_image(
    screen_id=id,
    format="png",
    scale=3  # ⚠️ 필수! (1=저해상도, 2=중해상도, 3=고해상도)
)
```

### HTML 추출 - 명시적 호출 필수

```python
# ❌ 잘못된 사용 (HTML 미생성)
# fetch_screen_code를 호출하지 않으면 HTML 파일이 생성되지 않음!

# ✅ 올바른 사용 (HTML 생성)
mcp__stitch__fetch_screen_code(
    screen_id=id,
    format="html"  # ⚠️ 반드시 명시!
)
```

### 체크리스트

| 항목 | 필수 옵션 | 기본값 문제 |
|------|----------|-------------|
| 이미지 해상도 | `scale=3` | scale 미지정 시 저해상도 |
| HTML 생성 | `fetch_screen_code()` 호출 | 미호출 시 HTML 미생성 |
| 이미지 포맷 | `format="png"` | 권장 |

---

## 개요

Google Stitch MCP Auto를 사용하여 화면 명세(YAML)에서 디자인 목업을 자동 생성하고,
생성된 이미지, HTML, 디자인 토큰을 프로젝트에 반영합니다.

---

## 사전 요구사항

### 방법 1: API Key 인증 (권장 - 간단!)

GCP 프로젝트 없이 API Key만으로 설정 가능합니다.

```
📋 Step 1: API Key 생성
   👉 https://stitch.withgoogle.com/settings
   → "Create Key" 클릭 → 생성된 Key 복사

📋 Step 2: Claude Labs 인스톨러
   $ ./install.sh → Stitch MCP 선택 → API Key 입력
```

**Claude Code MCP 설정 (API Key 포함)**:

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/stitch-mcp"],
      "env": {
        "STITCH_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 방법 2: ADC 인증 (gcloud 필요)

Google Cloud CLI가 이미 설치되어 있다면 ADC 인증도 가능합니다.

```bash
# gcloud CLI 설치 후 인증
gcloud auth application-default login
```

```json
// ~/.claude/settings.json (ADC 방식)
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/stitch-mcp"]
    }
  }
}
```

> **간편 설정**: Claude Labs 인스톨러 실행 → "Stitch MCP" 선택
> ```bash
> ./install.sh
> ```

---

## 주요 MCP 도구

### 생성 (Generation)

| 도구 | 설명 | 주요 파라미터 |
|------|------|--------------|
| `generate_screen_from_text` | 텍스트 프롬프트로 화면 생성 | `project_id`, `prompt` |
| `batch_generate_screens` | 여러 화면 일괄 생성 | `project_id`, `prompts[]` |
| `apply_design_context` | 기존 디자인 스타일 적용 | `project_id`, `screen_id`, `context` |

### 추출 (Extraction)

| 도구 | 설명 | 반환값 | **필수 옵션** |
|------|------|--------|---------------|
| `fetch_screen_image` | 스크린샷 추출 | PNG/JPG 이미지 데이터 | **`scale=3` 필수!** |
| `fetch_screen_code` | HTML/코드 추출 | HTML 문자열 | **`format="html"` 필수!** |
| `extract_design_context` | 디자인 DNA 추출 | 색상, 타이포, 간격 정보 | - |
| `extract_components` | 재사용 컴포넌트 추출 | 컴포넌트 정의 목록 | - |

> ⚠️ **중요**: `fetch_screen_image`와 `fetch_screen_code`는 **반드시 함께** 호출해야 합니다!

### 시스템 (Design System)

| 도구 | 설명 | 반환값 |
|------|------|--------|
| `generate_design_tokens` | CSS/Tailwind 토큰 생성 | 토큰 파일 내용 |
| `export_design_system` | 전체 디자인 시스템 내보내기 | 디자인 시스템 패키지 |

### 품질 (Quality)

| 도구 | 설명 | 반환값 |
|------|------|--------|
| `analyze_accessibility` | WCAG 2.1 접근성 검사 | 점수 및 개선 항목 |

---

## 워크플로우

### Phase 5: Stitch 디자인 생성

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: Stitch 디자인 생성                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 프로젝트 생성/조회                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  mcp__stitch__create_project(name="MyApp")          │    │
│  │  → project_id 획득                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Step 2: 디자인 시스템 문서 로드                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Read: docs/planning/05-design-system.md            │    │
│  │  → colors, typography, spacing 추출                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Step 3: 화면별 생성 루프                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  for each specs/screens/*.yaml:                     │    │
│  │    1. build_stitch_prompt(yaml, design_system)      │    │
│  │    2. generate_screen_from_text(prompt)             │    │
│  │    3. fetch_screen_image → design/screens/*.png     │    │
│  │    4. fetch_screen_code → design/html/*.html        │    │
│  │    5. analyze_accessibility → score                 │    │
│  │    6. update yaml with design_reference             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Step 4: 디자인 토큰 생성                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  mcp__stitch__generate_design_tokens(format="css")  │    │
│  │  → specs/design-tokens.yaml                         │    │
│  │  → specs/design-tokens.css                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## MCP 도구 호출 시퀀스

### 1. 프로젝트 초기화

```python
# 프로젝트 생성 또는 기존 프로젝트 조회
project = mcp__stitch__create_project(
    name="MyApp Screens",
    description="E-commerce application screens"
)
project_id = project["id"]
```

### 2. 첫 번째 화면 생성 (디자인 컨텍스트 설정)

```python
# 디자인 시스템 정보 기반 프롬프트 생성
prompt = build_stitch_prompt(
    yaml_spec=product_list_yaml,
    design_system=design_system_doc
)

# 화면 생성
screen = mcp__stitch__generate_screen_from_text(
    project_id=project_id,
    prompt=prompt
)
first_screen_id = screen["id"]

# 디자인 컨텍스트 추출 (이후 화면에 재사용)
design_context = mcp__stitch__extract_design_context(
    screen_id=first_screen_id
)
```

### 3. 이후 화면 생성 (컨텍스트 적용)

```python
for yaml_file in remaining_screens:
    prompt = build_stitch_prompt(yaml_file, design_system_doc)

    # 화면 생성
    screen = mcp__stitch__generate_screen_from_text(
        project_id=project_id,
        prompt=prompt
    )

    # 디자인 컨텍스트 적용 (일관성 유지)
    mcp__stitch__apply_design_context(
        project_id=project_id,
        screen_id=screen["id"],
        context=design_context
    )
```

### 4. 결과 추출 및 저장 (⚠️ 필수 옵션 주의!)

> **중요**: 이미지와 HTML 추출은 **반드시** 아래 옵션을 사용해야 합니다!

```python
for screen in generated_screens:
    # ============================================
    # 🖼️ 이미지 추출 (scale=3 필수!)
    # ============================================
    # scale=1: 저해상도 (사용 금지)
    # scale=2: 중해상도 (최소 권장)
    # scale=3: 고해상도 (권장!) ← 기본값으로 사용
    image_data = mcp__stitch__fetch_screen_image(
        screen_id=screen["id"],
        format="png",
        scale=3  # ⚠️ 반드시 scale=3 사용! (고해상도)
    )
    save_file(f"design/screens/{screen['name']}.png", image_data)

    # ============================================
    # 📄 HTML 추출 (format="html" 필수!)
    # ============================================
    # ⚠️ 이 단계를 생략하면 HTML이 생성되지 않음!
    html_code = mcp__stitch__fetch_screen_code(
        screen_id=screen["id"],
        format="html"  # ⚠️ 반드시 명시!
    )
    save_file(f"design/html/{screen['name']}.html", html_code)

    # 접근성 검사
    a11y_result = mcp__stitch__analyze_accessibility(
        screen_id=screen["id"]
    )
    accessibility_score = a11y_result["score"]

    # YAML 업데이트
    update_yaml_with_design_reference(
        yaml_path=f"specs/screens/{screen['name']}.yaml",
        design_reference={
            "stitch_project_id": project_id,
            "screen_id": screen["id"],
            "image": f"design/screens/{screen['name']}.png",
            "html": f"design/html/{screen['name']}.html",
            "stitch_url": f"https://stitch.withgoogle.com/p/{project_id}/s/{screen['id']}",
            "generated_at": datetime.now().isoformat(),
            "accessibility_score": accessibility_score,
            "design_tokens_applied": True
        }
    )
```

### 5. 디자인 토큰 생성

```python
# CSS 변수 형식
css_tokens = mcp__stitch__generate_design_tokens(
    project_id=project_id,
    format="css"
)
save_file("specs/design-tokens.css", css_tokens)

# Tailwind 설정 형식
tailwind_config = mcp__stitch__generate_design_tokens(
    project_id=project_id,
    format="tailwind"
)
save_file("specs/tailwind.config.js", tailwind_config)

# YAML 형식 (통합 참조용)
yaml_tokens = convert_to_yaml(css_tokens)
save_file("specs/design-tokens.yaml", yaml_tokens)
```

---

## 출력 구조

```
프로젝트/
├── specs/
│   ├── domain/
│   │   └── resources.yaml
│   ├── screens/
│   │   ├── product-list.yaml      # + design_reference 필드
│   │   ├── product-detail.yaml
│   │   └── checkout.yaml
│   ├── design-tokens.yaml         # Stitch에서 자동 생성
│   ├── design-tokens.css          # CSS 변수
│   └── shared/
│       └── components.yaml
│
├── design/                         # Stitch 출력물
│   ├── screens/
│   │   ├── product-list.png       # 목업 이미지
│   │   ├── product-detail.png
│   │   └── checkout.png
│   ├── html/
│   │   ├── product-list.html      # 생성된 HTML
│   │   ├── product-detail.html
│   │   └── checkout.html
│   └── stitch-project.json        # 프로젝트 메타데이터
│
└── docs/planning/
    └── 06-tasks.md                # design_reference 포함 태스크
```

---

## 디자인 토큰 YAML 형식

```yaml
# specs/design-tokens.yaml
version: "1.0"
generated_at: "2026-01-27T10:30:00Z"
stitch_project_id: "proj_abc123"

colors:
  primary: "#3B82F6"
  primary-light: "#60A5FA"
  primary-dark: "#2563EB"
  secondary: "#64748B"
  surface: "#F8FAFC"
  background: "#FFFFFF"
  text-primary: "#1E293B"
  text-secondary: "#64748B"
  success: "#22C55E"
  warning: "#EAB308"
  error: "#EF4444"

typography:
  font-family:
    sans: "Pretendard, system-ui, -apple-system, sans-serif"
    mono: "Roboto Mono, monospace"
  font-size:
    display: "36px"
    h1: "28px"
    h2: "22px"
    h3: "18px"
    body-lg: "16px"
    body: "14px"
    caption: "12px"
  font-weight:
    regular: 400
    medium: 500
    semibold: 600
    bold: 700

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"

border-radius:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"

shadows:
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)"
  md: "0 2px 4px rgba(0, 0, 0, 0.1)"
  lg: "0 4px 8px rgba(0, 0, 0, 0.1)"

# Tailwind 변환
tailwind_config: |
  module.exports = {
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#3B82F6',
            light: '#60A5FA',
            dark: '#2563EB',
          },
          surface: '#F8FAFC',
        },
        fontFamily: {
          sans: ['Pretendard', 'system-ui', 'sans-serif'],
        },
      },
    },
  }
```

---

## 에러 처리

### 일반적인 오류

| 에러 | 원인 | 해결 |
|------|------|------|
| `UNAUTHENTICATED` | Google 인증 만료 | `npx @_davideast/stitch-mcp init` 재실행 |
| `QUOTA_EXCEEDED` | API 사용량 초과 | 잠시 대기 후 재시도 |
| `INVALID_PROMPT` | 프롬프트가 너무 짧음 | 더 상세한 프롬프트 작성 |
| `PROJECT_NOT_FOUND` | 프로젝트 ID 오류 | init으로 프로젝트 재설정 |

### 재시도 로직

```python
import time

def generate_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            return mcp__stitch__generate_screen_from_text(
                project_id=project_id,
                prompt=prompt
            )
        except QuotaExceededError:
            if attempt < max_retries - 1:
                time.sleep(60)  # 1분 대기
            else:
                raise
```

---

## 사용자 인터랙션

### Stitch 연동 여부 확인

```
[Stitch 디자인 생성]

화면 명세가 완료되었습니다. Google Stitch로 디자인 목업을 생성할까요?

1. 예 - 모든 화면 생성 (권장)
2. 선택 - 특정 화면만 선택
3. 아니오 - 건너뛰기

Stitch 연동 시:
- 디자인 시스템 문서의 색상/폰트/간격 자동 적용
- 생성된 목업 이미지와 HTML 자동 저장
- 접근성 검사 자동 수행
- YAML에 design_reference 자동 추가
```

### 특정 화면 선택

```
[화면 선택]

Stitch로 생성할 화면을 선택하세요 (Space로 선택, Enter로 확인):

[x] product-list (상품 목록)
[x] product-detail (상품 상세)
[ ] cart (장바구니) - 이미 생성됨
[ ] checkout (결제)

선택된 화면: 2개
```

### 진행 상황 표시

```
[Stitch 디자인 생성 진행 중]

[1/3] 상품 목록 생성 중...
      ├── 프롬프트 생성 완료
      ├── Stitch 화면 생성 완료 (screen_id: xyz789)
      ├── 이미지 추출 완료 → design/screens/product-list.png
      ├── HTML 추출 완료 → design/html/product-list.html
      ├── 접근성 검사 완료 (점수: 92/100)
      └── YAML 업데이트 완료

[2/3] 상품 상세 생성 중...
      ...

완료! 3개 화면 생성됨.
- design/screens/: 3개 이미지
- design/html/: 3개 HTML
- 평균 접근성 점수: 89/100
```

---

## 관련 문서

- [Stitch 프롬프트 빌더](./stitch-prompt-builder.md)
- [화면 명세 스키마 v2.0](./schema.md)
- [디자인 시스템 템플릿](../../socrates/references/design-system-template.md)
