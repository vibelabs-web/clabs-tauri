# MOVIN Design Tokens

> CSS 변수 및 Tailwind 설정을 위한 디자인 토큰

---

## CSS Custom Properties

```css
:root {
  /* ===== Colors ===== */

  /* Background */
  --color-bg-primary: #0a0a0a;
  --color-bg-secondary: #141414;
  --color-bg-tertiary: #1a1a1a;
  --color-bg-elevated: #1f1f1f;

  /* Accent - Neon */
  --color-accent-neon: #c8ff00;
  --color-accent-neon-hover: #b8eb00;
  --color-accent-neon-muted: rgba(200, 255, 0, 0.1);

  /* Accent - Secondary */
  --color-accent-green: #00ff88;
  --color-accent-blue: #00d4ff;
  --color-accent-purple: #a855f7;

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-muted: rgba(255, 255, 255, 0.4);
  --color-text-disabled: rgba(255, 255, 255, 0.2);

  /* Border */
  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-hover: rgba(255, 255, 255, 0.2);
  --color-border-focus: rgba(200, 255, 0, 0.5);

  /* Status */
  --color-success: #00ff88;
  --color-warning: #ffaa00;
  --color-error: #ff4444;
  --color-info: #00d4ff;

  /* ===== Typography ===== */

  /* Font Family */
  --font-sans: 'Inter', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Size */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 3.75rem;    /* 60px */
  --text-7xl: 4.5rem;     /* 72px */

  /* Font Weight */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Height */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Letter Spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;

  /* ===== Spacing ===== */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */

  /* ===== Border Radius ===== */
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
  --radius-full: 9999px;

  /* ===== Shadows ===== */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.5);
  --shadow-glow-neon: 0 0 20px rgba(200, 255, 0, 0.3);
  --shadow-glow-blue: 0 0 20px rgba(0, 212, 255, 0.3);

  /* ===== Animation ===== */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 700ms;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ===== Z-Index ===== */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}
```

---

## Tailwind Configuration

```javascript
// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#141414',
        'bg-tertiary': '#1a1a1a',
        'bg-elevated': '#1f1f1f',

        // Accent
        'accent-neon': '#c8ff00',
        'accent-green': '#00ff88',
        'accent-blue': '#00d4ff',
        'accent-purple': '#a855f7',

        // Semantic
        'success': '#00ff88',
        'warning': '#ffaa00',
        'error': '#ff4444',
        'info': '#00d4ff',
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', 'Fira Code', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-neon': '0 0 20px rgba(200, 255, 0, 0.3)',
        'glow-blue': '0 0 20px rgba(0, 212, 255, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(200, 255, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(200, 255, 0, 0.5)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-expo': 'cubic-bezier(0.65, 0, 0.35, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
```

---

## Global Styles

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-white/10;
  }

  html {
    @apply scroll-smooth;
  }

  body {
    @apply bg-bg-primary text-white font-sans antialiased;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    @apply w-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-bg-secondary;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-white/20 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-white/30;
  }

  /* Selection */
  ::selection {
    @apply bg-accent-neon/30 text-white;
  }
}

@layer components {
  /* Neon Glow Effect */
  .glow-neon {
    @apply shadow-glow-neon;
  }

  /* Glass Effect */
  .glass {
    @apply bg-white/5 backdrop-blur-md border border-white/10;
  }

  /* Gradient Text */
  .gradient-text {
    @apply bg-gradient-to-r from-accent-neon to-accent-green bg-clip-text text-transparent;
  }
}

@layer utilities {
  /* Hide scrollbar */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

---

## Color Palette Preview

```
Background Colors:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Primary    │  Secondary   │   Tertiary   │   Elevated   │
│   #0a0a0a    │   #141414    │   #1a1a1a    │   #1f1f1f    │
│   ████████   │   ████████   │   ████████   │   ████████   │
└──────────────┴──────────────┴──────────────┴──────────────┘

Accent Colors:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Neon Green  │    Green     │     Blue     │    Purple    │
│   #c8ff00    │   #00ff88    │   #00d4ff    │   #a855f7    │
│   ████████   │   ████████   │   ████████   │   ████████   │
└──────────────┴──────────────┴──────────────┴──────────────┘

Text Colors:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Primary    │  Secondary   │    Muted     │   Disabled   │
│   #ffffff    │ rgba(70%)    │ rgba(40%)    │ rgba(20%)    │
│   ████████   │   ████████   │   ████████   │   ████████   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```
