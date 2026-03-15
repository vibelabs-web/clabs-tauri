# Tailwind CSS v4 문법 규칙

> **핵심**: Tailwind CSS v4는 설정 방식이 완전히 변경됨. 반드시 버전 확인 후 해당 문법 사용!

---

## 버전 확인 (MUST)

코드 생성 전 **반드시** `package.json`에서 Tailwind 버전 확인:

```bash
grep "tailwindcss" package.json
```

---

## v3 vs v4 문법 비교

### CSS 파일 (app.css / globals.css)

| v3 (3.x) | v4 (4.x) |
|----------|----------|
| `@tailwind base;`<br>`@tailwind components;`<br>`@tailwind utilities;` | `@import "tailwindcss";` |

### 설정 파일

| v3 (3.x) | v4 (4.x) |
|----------|----------|
| `tailwind.config.js` 필수 | 설정 파일 불필요 (CSS에서 직접 설정) |
| `content: ['./src/**/*.{html,js,svelte,ts}']` | 자동 감지 |

---

## v4 전용 CSS 설정

```css
/* app.css (v4) */
@import "tailwindcss";

/* 테마 커스터마이징 (v4 방식) */
@theme {
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
}

/* 커스텀 유틸리티 (v4 방식) */
@utility .btn-primary {
  @apply bg-primary text-white px-4 py-2 rounded;
}
```

---

## 금지 패턴 (v4에서 사용 금지)

```css
/* ❌ v4에서 동작 안 함 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ❌ v4에서 불필요 */
/* tailwind.config.js 파일 자체가 불필요 */
```

---

## 마이그레이션 체크리스트

v4 사용 시 확인:

- [ ] `package.json`에 `"tailwindcss": "^4.x"` 확인
- [ ] CSS 파일에 `@import "tailwindcss";` 사용
- [ ] `tailwind.config.js` 파일 삭제 (또는 미사용)
- [ ] `postcss.config.js`에서 `tailwindcss` 플러그인 확인

---

## 프레임워크별 적용

### SvelteKit + Tailwind v4

```css
/* src/app.css */
@import "tailwindcss";
```

```svelte
<!-- +layout.svelte -->
<script>
  import '../app.css';
</script>
```

### Next.js + Tailwind v4

```css
/* app/globals.css */
@import "tailwindcss";
```

### React + Vite + Tailwind v4

```css
/* src/index.css */
@import "tailwindcss";
```

---

## 관련 문서

- [Tailwind CSS v4 공식 문서](https://tailwindcss.com/docs)
- [v3 → v4 마이그레이션 가이드](https://tailwindcss.com/docs/upgrade-guide)
