---
name: vercel-review
description: Vercel 엔지니어링 기반 React/Next.js 성능 최적화 및 웹 인터페이스 가이드라인 리뷰. 프론트엔드 코드의 성능, 접근성, 디자인 패턴을 검토합니다.
---

# Vercel Review Skill

Vercel Labs의 agent-skills 기반 프론트엔드 코드 리뷰 스킬입니다.

> **출처**: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

---

## 트리거

다음 상황에서 이 스킬이 호출됩니다:

- "프론트엔드 코드 리뷰해줘"
- "React 성능 검토해줘"
- "접근성 체크해줘"
- "UI 가이드라인 확인해줘"
- frontend-specialist가 작업 완료 후 자동 호출

---

## 리뷰 영역

### 1. React/Next.js 성능 최적화 (45개 규칙)

8개 카테고리로 구성된 성능 최적화 가이드라인:

| 카테고리 | Impact | 주요 내용 |
|---------|--------|----------|
| **워터폴 제거** | CRITICAL | 병렬 데이터 페칭, Promise.all 사용 |
| **번들 크기 최적화** | CRITICAL | 코드 스플리팅, dynamic import, tree shaking |
| **서버 사이드 성능** | HIGH | 캐싱, 스트리밍, ISR |
| **클라이언트 데이터 페칭** | MEDIUM-HIGH | SWR/React Query, 중복 제거 |
| **리렌더링 최적화** | MEDIUM | memo, useMemo, useCallback |
| **렌더링 성능** | MEDIUM | DOM 최적화, 가상화 |
| **JavaScript 성능** | LOW-MEDIUM | 알고리즘 최적화 |
| **고급 패턴** | LOW | 전문 기술 |

### 2. 웹 인터페이스 가이드라인 (100+ 규칙)

11개 카테고리의 UI/UX 모범 사례:

| 카테고리 | 주요 체크 항목 |
|---------|--------------|
| **접근성** | aria-label, 시맨틱 HTML, 키보드 핸들러 |
| **포커스 상태** | focus-visible:ring-*, outline 대체 |
| **폼** | autocomplete, type, label 연결, 에러 처리 |
| **애니메이션** | prefers-reduced-motion, transform/opacity만 사용 |
| **타이포그래피** | 따옴표, 줄임표, tabular-nums, text-wrap: balance |
| **콘텐츠** | truncate, line-clamp, 빈 상태 처리 |
| **이미지** | width/height 명시, lazy-load, priority |
| **성능** | 가상화 (50+ 항목), DOM 배치, preconnect |
| **네비게이션** | URL 상태 반영, 딥 링크, 확인 다이얼로그 |
| **터치/인터랙션** | touch-action, overscroll-behavior |
| **기타** | 다크 모드, i18n, hydration 가드 |

---

## 사용 방법

### 수동 호출

```
/vercel-review src/components/MyComponent.tsx
/vercel-review src/pages/**/*.tsx
/vercel-review  # 현재 변경된 파일 자동 감지
```

### 자동 호출 (frontend-specialist 연동)

frontend-specialist가 컴포넌트 작성 완료 후 자동으로 호출됩니다.

---

## 리뷰 워크플로우

### 1단계: 파일 확인

```
리뷰 대상 파일을 확인합니다:
- 인자로 전달된 파일 경로
- 또는 git diff로 변경된 프론트엔드 파일
```

### 2단계: 성능 규칙 체크

```
React/Next.js 성능 최적화 규칙 적용:
1. CRITICAL 이슈 우선 확인
2. HIGH 이슈 확인
3. MEDIUM 이슈 확인
```

### 3단계: UI 가이드라인 체크

```
웹 인터페이스 가이드라인 적용:
1. 접근성 (WCAG)
2. 포커스 상태
3. 폼 검증
4. 애니메이션
5. 성능
```

### 4단계: 결과 보고

```
파일:라인 형식으로 이슈 보고:

src/components/Button.tsx:15 - [CRITICAL] 워터폴 감지: 순차적 API 호출을 Promise.all로 변경
src/components/Form.tsx:42 - [HIGH] 접근성: input에 aria-label 또는 연결된 label 필요
src/pages/index.tsx:8 - [MEDIUM] 성능: 50개 이상 리스트는 가상화 적용 권장
```

---

## Anti-Patterns (자동 플래그)

다음 패턴이 발견되면 자동으로 경고:

| 패턴 | 문제 |
|------|------|
| `<meta name="viewport" ... user-scalable=no>` | 접근성: 줌 비활성화 금지 |
| `transition: all` | 성능: 구체적 속성만 전환 |
| `outline: none` (대체 없이) | 접근성: 포커스 표시 필수 |
| `<div onClick>` (button 대신) | 접근성: 시맨틱 요소 사용 |
| `<input>` (label 없이) | 접근성: 레이블 필수 |
| 하드코딩된 날짜/숫자 포맷 | i18n: Intl.* 사용 권장 |

---

## 출력 형식

```markdown
## Vercel Review 결과

### CRITICAL (즉시 수정 필요)
- `src/components/DataFetcher.tsx:12` - 워터폴 감지: 순차 fetch를 Promise.all로 변경

### HIGH (권장 수정)
- `src/components/IconButton.tsx:8` - aria-label 누락
- `src/pages/dashboard.tsx:45` - Image에 width/height 누락

### MEDIUM (개선 권장)
- `src/components/List.tsx:20` - 100개 이상 항목, 가상화 적용 권장

### 통과
- 폼 검증 ✅
- 다크 모드 지원 ✅
- 애니메이션 최적화 ✅

---

총 이슈: 4개 (CRITICAL: 1, HIGH: 2, MEDIUM: 1)
```

---

## 참조 문서

### React Best Practices (Vercel)

원본: `https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices`

### Web Interface Guidelines

원본: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-15 | 초기 버전 - Vercel agent-skills 기반 리뷰 스킬 생성 |
