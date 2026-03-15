---
name: tauri-package-win
description: Tauri 앱을 Windows용으로 크로스 빌드 또는 Windows 환경에서 직접 빌드. "윈도우 빌드", "Windows 패키징", "exe 만들어줘" 등의 키워드에 반응.
---

# Tauri Package Win (Windows 빌드)

## 개요

Clabs Tauri 앱을 Windows .exe 인스톨러 및 .msi로 빌드한다.

**핵심 원칙:** 빌드 → 검증 → 배포, 한 번에 끝.

---

## 실행 절차

### Step 1: 환경 확인

Windows에서 직접 빌드하는 경우:

```powershell
# Node.js
node --version
# Rust 툴체인
rustc --version
cargo --version
# WebView2 (Windows 10/11에 기본 포함)
```

macOS/Linux에서 크로스 빌드하는 경우:

```bash
# Windows 크로스 컴파일 타겟 추가
rustup target add x86_64-pc-windows-msvc
```

> **참고:** macOS에서 Windows 크로스 빌드는 제한적. Windows VM 또는 CI를 권장.

### Step 2: 의존성 설치

```bash
cd PROJECT_ROOT
npm install
```

### Step 3: 빌드 (Windows 환경)

```powershell
cd PROJECT_ROOT
npx tauri build
```

> 빌드 결과:
> - `.exe` (NSIS): `src-tauri/target/release/bundle/nsis/Clabs_*_x64-setup.exe`
> - `.msi`: `src-tauri/target/release/bundle/msi/Clabs_*_x64_en-US.msi`

### Step 4: 빌드 검증

```powershell
dir src-tauri\target\release\bundle\nsis\*.exe
dir src-tauri\target\release\bundle\msi\*.msi
```

### Step 5: 설치 (선택)

NSIS 인스톨러 실행:

```powershell
Start-Process "src-tauri\target\release\bundle\nsis\Clabs_1.9.3_x64-setup.exe"
```

또는 MSI 사일런트 설치:

```powershell
msiexec /i "src-tauri\target\release\bundle\msi\Clabs_1.9.3_x64_en-US.msi" /qn
```

---

## GitHub Actions CI (권장)

macOS에서 Windows 빌드가 어려우므로, CI로 빌드하는 것을 권장:

```yaml
# .github/workflows/build-windows.yml
name: Build Windows
on: [push]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-toolchain@stable
      - run: npm install
      - run: npx tauri build
      - uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: src-tauri/target/release/bundle/nsis/*.exe
```

---

## 주의사항

- Windows 빌드에는 WebView2 런타임 필요 (Windows 10/11에 기본 포함)
- 코드 서명 없이 빌드 시 SmartScreen 경고 발생 가능
- x64 기본 타겟 (ARM64는 별도 설정 필요)
- NSIS 인스톨러가 기본 번들 타겟

---

## 빠른 참조

| 항목 | 값 |
|------|-----|
| 빌드 명령 | `npx tauri build` |
| .exe 경로 | `src-tauri/target/release/bundle/nsis/Clabs_*_x64-setup.exe` |
| .msi 경로 | `src-tauri/target/release/bundle/msi/Clabs_*_x64_en-US.msi` |
| 설정 파일 | `src-tauri/tauri.conf.json` |
| Rust 소스 | `src-tauri/src/` |
| CI 권장 | GitHub Actions (windows-latest) |
