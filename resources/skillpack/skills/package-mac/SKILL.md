---
name: package-mac
description: Electron 앱을 macOS용으로 빌드하고 /Applications에 설치. "패키징", "빌드해줘", "앱 만들어줘", "Applications에 복사" 등의 키워드에 반응.
---

# Package Mac (macOS 빌드 & 설치)

## 개요

Clabs Electron 앱을 macOS .app으로 빌드하고 /Applications 폴더에 자동 설치한다.

**핵심 원칙:** 빌드 → 검증 → 설치, 한 번에 끝.

---

## 실행 절차

### Step 1: 기존 프로세스 종료

실행 중인 Clabs 앱이 있으면 먼저 종료한다.

```bash
pkill -f "Clabs" 2>/dev/null || true
```

### Step 2: 빌드

순서대로 실행:

1. **Main 프로세스 컴파일** — `tsc -p tsconfig.main.json`
2. **Renderer 빌드** — `vite build`
3. **electron-builder 패키징** — `electron-builder --mac --config electron-builder.yml`

한 줄 명령:
```bash
cd PROJECT_ROOT && npm run build:main && npm run build:renderer && npx electron-builder --mac --config electron-builder.yml
```

> 빌드 결과: `release/mac-arm64/Clabs.app`

### Step 3: 빌드 검증

`.app` 파일이 정상적으로 생성되었는지 확인:

```bash
ls -la release/mac-arm64/Clabs.app
```

실패 시 에러 로그를 분석하고 사용자에게 보고한다.

### Step 4: /Applications에 복사

기존 앱을 교체하며 설치:

```bash
rm -rf /Applications/Clabs.app && cp -R release/mac-arm64/Clabs.app /Applications/
```

### Step 5: 설치 확인

```bash
ls -la /Applications/Clabs.app
```

### Step 6: 앱 실행 (선택)

사용자가 요청하면 설치된 앱을 실행:

```bash
open /Applications/Clabs.app
```

---

## 주의사항

- 코드 서명 없이 빌드하므로 개발 용도 전용
- Apple Silicon (arm64) 기본 타겟
- 빌드 전 `node_modules`가 설치되어 있어야 함 (`npm install`)
- 빌드 실패 시 `release/builder-debug.yml` 확인

---

## 빠른 참조

| 항목 | 값 |
|------|-----|
| 빌드 명령 | `npm run build:mac` |
| 출력 경로 | `release/mac-arm64/Clabs.app` |
| 설치 경로 | `/Applications/Clabs.app` |
| 설정 파일 | `electron-builder.yml` |
| 아이콘 | `build/icon.icns` |
