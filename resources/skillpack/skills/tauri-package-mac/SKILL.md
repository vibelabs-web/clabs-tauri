---
name: tauri-package-mac
description: Tauri 앱을 macOS용으로 빌드하고 /Applications에 설치. "패키징", "빌드해줘", "앱 만들어줘", "Applications에 복사" 등의 키워드에 반응.
---

# Tauri Package Mac (macOS 빌드 & 설치)

## 개요

Clabs Tauri 앱을 macOS .app 및 .dmg로 빌드하고 /Applications 폴더에 자동 설치한다.

**핵심 원칙:** 빌드 → 검증 → 설치, 한 번에 끝.

---

## 실행 절차

### Step 1: 기존 프로세스 종료

실행 중인 Clabs 앱이 있으면 먼저 종료한다.

```bash
pkill -f "Clabs" 2>/dev/null || true
pkill -f "target.*clabs" 2>/dev/null || true
```

### Step 2: 의존성 확인

```bash
cd PROJECT_ROOT
# Node 의존성
[ -d node_modules ] || npm install
# Rust 툴체인
rustc --version && cargo --version
```

### Step 3: 빌드

`npx tauri build` 한 명령으로 Renderer 빌드 + Rust 컴파일 + 번들링까지 수행:

```bash
cd PROJECT_ROOT && npx tauri build
```

> 빌드 결과:
> - `.app`: `src-tauri/target/release/bundle/macos/Clabs.app`
> - `.dmg`: `src-tauri/target/release/bundle/dmg/Clabs_*_aarch64.dmg`

### Step 4: 빌드 검증

`.app` 파일이 정상적으로 생성되었는지 확인:

```bash
ls -la src-tauri/target/release/bundle/macos/Clabs.app
ls -la src-tauri/target/release/bundle/dmg/*.dmg
```

실패 시 에러 로그를 분석하고 사용자에게 보고한다.

### Step 5: /Applications에 복사

기존 앱을 교체하며 설치:

```bash
rm -rf /Applications/Clabs.app && cp -R src-tauri/target/release/bundle/macos/Clabs.app /Applications/
```

### Step 6: 설치 확인

```bash
ls -la /Applications/Clabs.app
```

### Step 7: 앱 실행 (선택)

사용자가 요청하면 설치된 앱을 실행:

```bash
open /Applications/Clabs.app
```

---

## 주의사항

- 코드 서명 없이 빌드하므로 개발 용도 전용
- Apple Silicon (aarch64) 기본 타겟
- 빌드 전 `node_modules`와 Rust 툴체인이 설치되어 있어야 함
- 첫 빌드 시 Rust 크레이트 다운로드로 시간이 오래 걸림 (이후 캐시됨)
- 빌드 실패 시 `cargo build` 에러 메시지 확인

---

## 빠른 참조

| 항목 | 값 |
|------|-----|
| 빌드 명령 | `npx tauri build` |
| .app 경로 | `src-tauri/target/release/bundle/macos/Clabs.app` |
| .dmg 경로 | `src-tauri/target/release/bundle/dmg/Clabs_*_aarch64.dmg` |
| 설치 경로 | `/Applications/Clabs.app` |
| 설정 파일 | `src-tauri/tauri.conf.json` |
| Rust 소스 | `src-tauri/src/` |
| 아이콘 | `src-tauri/icons/` |
