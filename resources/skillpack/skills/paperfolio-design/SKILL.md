---
name: paperfolio-design
description: Clean, bold, modern 포트폴리오 디자인 시스템. 대형 타이포그래피, 미니멀 레이아웃, 강렬한 시각적 계층.
trigger: /paperfolio 또는 "포트폴리오 디자인", "Paperfolio 스타일" 키워드
---

# Paperfolio Design System

> Clean, Bold, Modern - 방해 요소 없이 작업을 돋보이게 하는 포트폴리오 디자인

---

## 디자인 철학

```
┌─────────────────────────────────────────────────────────────┐
│  Paperfolio Design Philosophy                                │
│                                                              │
│  🎯 Clean & Minimal   - 순백 배경, 여백 극대화               │
│  📝 Bold Typography   - 초대형 세리프 헤드라인               │
│  🎨 Color Highlights  - 핵심 텍스트에 컬러 박스 강조         │
│  ⚫ Black & White     - 흑백 기반 + 포인트 컬러              │
│  ✨ Strong Hierarchy  - 명확한 시각적 계층 구조              │
└─────────────────────────────────────────────────────────────┘
```

---

## 컬러 시스템

### CSS Variables

```css
:root {
  /* Base Colors */
  --paperfolio-bg: #FFFFFF;
  --paperfolio-text: #000000;
  --paperfolio-text-muted: #6B7280;

  /* Accent Colors */
  --paperfolio-accent-coral: #FF6B6B;
  --paperfolio-accent-blue: #3B82F6;
  --paperfolio-accent-yellow: #FBBF24;

  /* UI Colors */
  --paperfolio-button-primary: #000000;
  --paperfolio-button-primary-text: #FFFFFF;
  --paperfolio-button-secondary: #FFFFFF;
  --paperfolio-button-secondary-border: #000000;

  /* Navigation */
  --paperfolio-nav-bg: #000000;
  --paperfolio-nav-text: #FFFFFF;
}
```

### 컬러 팔레트

| 용도 | 색상 | HEX | 사용처 |
|------|------|-----|--------|
| 배경 | 순백 | `#FFFFFF` | 전체 배경 |
| 텍스트 | 블랙 | `#000000` | 제목, 본문 |
| 보조 텍스트 | 그레이 | `#6B7280` | 설명, 캡션 |
| 강조 1 | 코랄 | `#FF6B6B` | 이름 하이라이트 |
| 강조 2 | 블루 | `#3B82F6` | 위치/키워드 하이라이트 |
| 강조 3 | 옐로우 | `#FBBF24` | 일러스트 배경 |

---

## 타이포그래피

### 폰트 스택

```css
/* Headlines - Bold Serif */
--paperfolio-font-heading: 'Playfair Display', 'Georgia', serif;

/* Body - Clean Sans-serif */
--paperfolio-font-body: 'Inter', 'system-ui', sans-serif;

/* Navigation */
--paperfolio-font-nav: 'Inter', 'system-ui', sans-serif;
```

### 타입 스케일

```css
/* Display - Hero 헤드라인 */
.paperfolio-display {
  font-family: var(--paperfolio-font-heading);
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Heading 1 */
.paperfolio-h1 {
  font-family: var(--paperfolio-font-heading);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.2;
}

/* Heading 2 */
.paperfolio-h2 {
  font-family: var(--paperfolio-font-heading);
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 600;
  line-height: 1.3;
}

/* Body */
.paperfolio-body {
  font-family: var(--paperfolio-font-body);
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.7;
  color: var(--paperfolio-text-muted);
}

/* Small */
.paperfolio-small {
  font-family: var(--paperfolio-font-body);
  font-size: 0.875rem;
  font-weight: 400;
}
```

---

## 컴포넌트

### 1. 네비게이션 (Pill Navigation)

```tsx
// React/Next.js Component
function PaperfolioNav() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-8 bg-black text-white px-8 py-4 rounded-full">
        {/* Logo */}
        <div className="w-8 h-8 border-2 border-white rounded-full" />

        {/* Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <a href="#" className="hover:opacity-70 transition">Home</a>
          <a href="#" className="hover:opacity-70 transition">About</a>
          <a href="#" className="hover:opacity-70 transition">Portfolio</a>
          <a href="#" className="hover:opacity-70 transition">Pages</a>
          <a href="#" className="hover:opacity-70 transition">Cart(0)</a>
        </div>

        {/* CTA */}
        <button className="bg-white text-black p-2 rounded-lg">
          <MailIcon className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
```

**Tailwind 클래스:**
```
bg-black text-white px-8 py-4 rounded-full
```

### 2. 하이라이트 텍스트

```tsx
// 컬러 박스로 강조된 텍스트
function HighlightText({ children, color = 'coral' }) {
  const colors = {
    coral: 'bg-[#FF6B6B]',
    blue: 'bg-[#3B82F6]',
    yellow: 'bg-[#FBBF24]'
  };

  return (
    <span className={`${colors[color]} px-2 py-1 text-white inline-block`}>
      {children}
    </span>
  );
}

// 사용 예시
<h1 className="paperfolio-display">
  I'm <HighlightText color="coral">John Carter</HighlightText>,
  <br />
  a Web Designer
  <br />
  from <HighlightText color="blue">New York</HighlightText>
</h1>
```

### 3. 버튼

```tsx
// Primary Button (Black)
function PrimaryButton({ children, icon }) {
  return (
    <button className="
      bg-black text-white
      px-8 py-4
      rounded-lg
      flex items-center gap-3
      font-medium
      hover:bg-gray-900
      transition
    ">
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// Secondary Button (White with border)
function SecondaryButton({ children, icon }) {
  return (
    <button className="
      bg-white text-black
      border-2 border-black
      px-8 py-4
      rounded-lg
      flex items-center gap-3
      font-medium
      hover:bg-gray-50
      transition
    ">
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
```

### 4. Hero Section

```tsx
function PaperfolioHero() {
  return (
    <section className="min-h-screen flex items-center px-8 lg:px-16">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left - Text */}
        <div className="space-y-8">
          <h1 className="paperfolio-display">
            I'm <HighlightText color="coral">John Carter</HighlightText>,
            <br />
            a Web Designer
            <br />
            from <HighlightText color="blue">New York</HighlightText>
          </h1>

          <p className="paperfolio-body max-w-lg">
            Lacus, adipiscing lectus convallis purus aliquet cursus magna
            montes augue donec cras turpis ultrices nulla sed doler.
          </p>

          <div className="flex gap-4">
            <PrimaryButton icon={<MailIcon />}>Get in touch</PrimaryButton>
            <SecondaryButton icon={<FolderIcon />}>View portfolio</SecondaryButton>
          </div>
        </div>

        {/* Right - Illustration */}
        <div className="relative">
          <div className="bg-[#FBBF24] rounded-3xl overflow-hidden aspect-square">
            {/* Illustrated avatar with polka dots */}
            <img src="/avatar-illustration.svg" alt="Avatar" />
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 5. 클라이언트 로고 배너 (Diagonal)

```tsx
function ClientLogoBanner() {
  const logos = ['business', 'company', 'startup', 'venture', 'agency'];

  return (
    <div className="bg-black -rotate-2 py-6 overflow-hidden">
      <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
        {logos.map((logo, i) => (
          <div key={i} className="flex items-center gap-3 text-white text-xl font-medium">
            <LogoIcon name={logo} />
            <span>{logo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 레이아웃 패턴

### 1. 페이지 구조

```
┌─────────────────────────────────────────────────────────┐
│  [Floating Pill Navigation - Fixed Top Center]          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │                     │  │                     │      │
│  │  Large Serif        │  │  Illustrated        │      │
│  │  Headline           │  │  Avatar             │      │
│  │  with Highlights    │  │  (Yellow BG)        │      │
│  │                     │  │                     │      │
│  │  Body Text          │  │                     │      │
│  │                     │  │                     │      │
│  │  [CTA] [Secondary]  │  │                     │      │
│  └─────────────────────┘  └─────────────────────┘      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Diagonal Black Banner with Client Logos]              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Portfolio Grid / Content Sections                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. 스페이싱 시스템

```css
/* Paperfolio Spacing Scale */
--space-xs: 0.5rem;   /* 8px */
--space-sm: 1rem;     /* 16px */
--space-md: 1.5rem;   /* 24px */
--space-lg: 2rem;     /* 32px */
--space-xl: 3rem;     /* 48px */
--space-2xl: 4rem;    /* 64px */
--space-3xl: 6rem;    /* 96px */

/* Section Padding */
.paperfolio-section {
  padding: var(--space-3xl) var(--space-lg);
}

/* Container Max Width */
.paperfolio-container {
  max-width: 1280px;
  margin: 0 auto;
}
```

---

## Tailwind 설정

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        paperfolio: {
          coral: '#FF6B6B',
          blue: '#3B82F6',
          yellow: '#FBBF24',
        }
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    }
  }
}
```

---

## 사용 방법

### 적용 시

```markdown
이 디자인을 적용하려면:

1. 컬러 시스템의 CSS 변수를 전역 스타일에 추가
2. Google Fonts에서 'Playfair Display'와 'Inter' 로드
3. Tailwind 설정에 커스텀 컬러와 폰트 추가
4. 컴포넌트 코드를 프로젝트에 맞게 조정
```

### 핵심 원칙 준수

1. **여백을 아끼지 말 것** - 콘텐츠 주변에 충분한 공간
2. **타이포그래피가 핵심** - 큰 세리프 헤드라인 사용
3. **컬러는 강조용** - 흑백 기반, 포인트 컬러만 사용
4. **일러스트레이션 활용** - 사진 대신 일러스트 권장
5. **깔끔한 인터랙션** - 심플한 hover 효과

---

## 참조

- 원본: [v0.app/templates/paperfolio](https://v0.app/templates/paperfolio-portfolio-template-dDPFIVqPGXR)
- 제작자: nikhilsbuilds
- 태그: portfolio, clean, minimal, modern
