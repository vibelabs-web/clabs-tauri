/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CSS 변수 참조로 테마 색상 동적 적용
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-hover': 'var(--color-bg-hover)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-disabled': 'var(--color-text-disabled)',
        // 액센트
        'accent': 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-light': 'var(--color-accent-light)',
        // 스펙트럼 컬러 (사용량)
        'usage-green': 'var(--color-usage-green)',
        'usage-yellow': 'var(--color-usage-yellow)',
        'usage-orange': 'var(--color-usage-orange)',
        'usage-red': 'var(--color-usage-red)',
        // 상태 컬러
        'status-success': 'var(--color-status-success)',
        'status-warning': 'var(--color-status-warning)',
        'status-error': 'var(--color-status-error)',
        'status-info': 'var(--color-status-info)',
        // 경계선
        'border-default': 'var(--color-border-default)',
        'border-hover': 'var(--color-border-hover)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
};
