# macOS 코드 서명 및 공증 가이드

> **@TASK P4-T3** - Mac 앱 코드 서명 및 공증 설정
> **@SPEC** Phase 4: 패키징 및 배포 - 코드 서명 및 보안

---

## 📋 목차

1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [인증서 설정](#인증서-설정)
4. [환경변수 설정](#환경변수-설정)
5. [electron-builder 설정](#electron-builder-설정)
6. [수동 서명 및 공증](#수동-서명-및-공증)
7. [CI/CD 환경 설정](#cicd-환경-설정)
8. [문제 해결](#문제-해결)

---

## 개요

macOS에서 앱을 배포하려면 Apple의 보안 요구사항을 충족해야 합니다:

| 요구사항 | 설명 |
|---------|------|
| **코드 서명** | Developer ID로 앱 서명 |
| **Hardened Runtime** | 보안 강화 런타임 활성화 |
| **공증 (Notarization)** | Apple 서버에서 악성코드 검사 |
| **Entitlements** | 앱 권한 명시 |

### 왜 필요한가?

- **Gatekeeper**: macOS 10.15+에서 서명/공증되지 않은 앱은 실행 차단
- **사용자 신뢰**: "알 수 없는 개발자" 경고 방지
- **보안**: 악성코드 배포 방지

---

## 사전 준비

### 1. Apple Developer 계정

```
✅ Apple Developer Program 가입 필요 ($99/년)
   https://developer.apple.com/programs/
```

### 2. 필요한 도구

```bash
# Xcode Command Line Tools
xcode-select --install

# 버전 확인
xcodebuild -version
codesign --version
```

### 3. 인증서 확인

```bash
# 현재 설치된 인증서 확인
security find-identity -v -p codesigning

# 출력 예시:
# 1) ABCDEF1234567890 "Developer ID Application: Your Name (TEAM_ID)"
# 2) 1234567890ABCDEF "Apple Development: your.email@example.com (TEAM_ID)"
```

---

## 인증서 설정

### 방법 1: Xcode를 통한 자동 설정 (권장)

```bash
# 1. Xcode 실행
open -a Xcode

# 2. Preferences > Accounts > Manage Certificates
# 3. "Developer ID Application" 인증서 생성
```

### 방법 2: 수동 생성

1. **Apple Developer 사이트 접속**
   - https://developer.apple.com/account/resources/certificates/list

2. **인증서 생성**
   - Type: "Developer ID Application"
   - Certificate Signing Request (CSR) 생성 필요

3. **CSR 생성**
   ```bash
   # Keychain Access 앱 실행
   # Certificate Assistant > Request a Certificate from a Certificate Authority
   # Email: developer@example.com
   # Common Name: Your Name
   # Save to disk
   ```

4. **다운로드 및 설치**
   - 생성된 `.cer` 파일 다운로드
   - 더블클릭하여 Keychain에 설치

---

## 환경변수 설정

### 로컬 개발 환경

`.env.local` 파일 생성 (절대 Git에 커밋하지 마세요!):

```bash
# Developer ID Application 인증서 이름
CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"

# Apple ID (공증용)
APPLE_ID="your.email@example.com"

# App-Specific Password (공증용)
# https://appleid.apple.com/account/manage > Security > App-Specific Passwords
APPLE_APP_SPECIFIC_PASSWORD="abcd-efgh-ijkl-mnop"

# Team ID
APPLE_TEAM_ID="ABCDEF1234"
```

### 환경변수 생성 방법

```bash
# 1. Apple ID 확인
echo "Apple ID: $(defaults read MobileMeAccounts Accounts | grep AccountID)"

# 2. Team ID 확인
security find-certificate -c "Developer ID Application" -p | \
  openssl x509 -noout -text | grep "OU="

# 3. App-Specific Password 생성
# https://appleid.apple.com/account/manage
# Security > App-Specific Passwords > Generate Password
```

---

## electron-builder 설정

### electron-builder.yml

```yaml
# @TASK P4-T3 - 코드 서명 설정
mac:
  category: public.app-category.developer-tools
  target:
    - dmg
    - pkg
  icon: build/icon.icns
  hardenedRuntime: true                          # Hardened Runtime 활성화
  gatekeeperAssess: false                        # Gatekeeper 평가 비활성화 (공증 후 자동)
  entitlements: build/entitlements.mac.plist     # Entitlements 파일
  entitlementsInherit: build/entitlements.mac.plist  # 상속 Entitlements

# 공증 설정 (환경변수 사용)
afterSign: scripts/notarize.js  # 공증 스크립트
```

### entitlements.mac.plist

이미 P4-T2에서 생성됨 (`build/entitlements.mac.plist`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <!-- Hardened Runtime 필수 -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>

    <!-- 네트워크 접근 -->
    <key>com.apple.security.network.client</key>
    <true/>

    <!-- 파일 시스템 접근 -->
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
  </dict>
</plist>
```

---

## 수동 서명 및 공증

### 1. 빌드

```bash
# electron-builder로 빌드 (자동 서명)
npm run build:mac

# 출력:
# release/clabs-1.0.0-mac-x64.dmg
# release/clabs-1.0.0-mac-x64.pkg
```

### 2. 서명 확인

```bash
# 서명 검증
codesign --verify --deep --strict --verbose=2 release/mac/clabs.app

# 상세 정보 확인
codesign -dv --verbose=4 release/mac/clabs.app

# Entitlements 확인
codesign -d --entitlements - release/mac/clabs.app
```

### 3. 공증 제출

```bash
# DMG 파일 공증
xcrun notarytool submit release/clabs-1.0.0-mac-x64.dmg \
  --apple-id "your.email@example.com" \
  --password "abcd-efgh-ijkl-mnop" \
  --team-id "ABCDEF1234" \
  --wait

# 공증 상태 확인
xcrun notarytool info <submission-id> \
  --apple-id "your.email@example.com" \
  --password "abcd-efgh-ijkl-mnop" \
  --team-id "ABCDEF1234"
```

### 4. 공증 티켓 스테이플링

```bash
# 공증 완료 후 티켓 첨부
xcrun stapler staple release/clabs-1.0.0-mac-x64.dmg

# 확인
xcrun stapler validate release/clabs-1.0.0-mac-x64.dmg
```

---

## CI/CD 환경 설정

### GitHub Actions

`.github/workflows/build.yml`:

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-mac:
    runs-on: macos-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm ci

      - name: Import Certificate
        env:
          CERTIFICATE_BASE64: ${{ secrets.CERTIFICATE_BASE64 }}
          CERTIFICATE_PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
        run: |
          # Base64 인증서 디코딩
          echo "$CERTIFICATE_BASE64" | base64 --decode > certificate.p12

          # Keychain 생성
          security create-keychain -p actions build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p actions build.keychain

          # 인증서 import
          security import certificate.p12 \
            -k build.keychain \
            -P "$CERTIFICATE_PASSWORD" \
            -T /usr/bin/codesign \
            -T /usr/bin/productsign

          # 코드서명 허용
          security set-key-partition-list -S apple-tool:,apple: \
            -s -k actions build.keychain

      - name: Build & Sign
        env:
          CSC_NAME: ${{ secrets.CSC_NAME }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run build:mac

      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: clabs-mac
          path: release/*.dmg
```

### GitHub Secrets 설정

| Secret 이름 | 설명 | 생성 방법 |
|-------------|------|----------|
| `CERTIFICATE_BASE64` | 인증서 Base64 인코딩 | `base64 -i certificate.p12 | pbcopy` |
| `CERTIFICATE_PASSWORD` | 인증서 비밀번호 | Keychain에서 설정한 비밀번호 |
| `CSC_NAME` | 인증서 이름 | "Developer ID Application: Name (ID)" |
| `APPLE_ID` | Apple ID | developer@example.com |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-Specific Password | Apple ID 사이트에서 생성 |
| `APPLE_TEAM_ID` | Team ID | 인증서에서 확인 |

---

## 문제 해결

### 1. "Developer cannot be verified" 경고

**원인**: 앱이 공증되지 않음

**해결**:
```bash
# 공증 상태 확인
spctl --assess --verbose=4 --type execute clabs.app

# 공증 재시도
xcrun notarytool submit clabs.dmg --apple-id ... --wait
```

### 2. "Code signature invalid" 에러

**원인**: Entitlements 불일치 또는 서명 손상

**해결**:
```bash
# 서명 제거
codesign --remove-signature clabs.app

# 재서명
codesign --sign "Developer ID Application: ..." \
  --entitlements build/entitlements.mac.plist \
  --options runtime \
  --deep --force \
  clabs.app
```

### 3. "App is damaged" 메시지

**원인**: Quarantine 속성 또는 서명 손상

**해결**:
```bash
# Quarantine 속성 제거
xattr -cr clabs.app

# 서명 재확인
codesign --verify --deep --strict clabs.app
```

### 4. Notarization 실패: "Invalid entitlements"

**원인**: Entitlements 파일에 허용되지 않은 권한

**해결**:
- `com.apple.security.app-sandbox`를 `true`로 설정하거나 제거
- `com.apple.security.cs.disable-library-validation` 제거 (배포 시)

### 5. CI에서 "No identity found" 에러

**원인**: Keychain에 인증서가 없거나 접근 불가

**해결**:
```bash
# 인증서 확인
security find-identity -v -p codesigning

# Keychain 잠금 해제
security unlock-keychain -p actions build.keychain

# 파티션 리스트 설정
security set-key-partition-list -S apple-tool:,apple: \
  -s -k actions build.keychain
```

---

## 참고 자료

- [Apple Developer: Code Signing](https://developer.apple.com/support/code-signing/)
- [Apple Developer: Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [electron-builder: Code Signing](https://www.electron.build/code-signing)
- [Hardened Runtime](https://developer.apple.com/documentation/security/hardened_runtime)

---

## 체크리스트

- [ ] Apple Developer 계정 가입
- [ ] Developer ID Application 인증서 생성
- [ ] App-Specific Password 생성
- [ ] `.env.local` 환경변수 설정
- [ ] `entitlements.mac.plist` 확인
- [ ] 로컬 빌드 및 서명 테스트
- [ ] 공증 제출 및 확인
- [ ] CI/CD GitHub Secrets 설정
- [ ] CI/CD 빌드 테스트

---

**작성일**: 2026-02-02
**작성자**: frontend-specialist (Claude Code)
**버전**: 1.0.0
