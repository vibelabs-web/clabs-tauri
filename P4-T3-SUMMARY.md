# P4-T3 완료 리포트: Mac 앱 코드 서명 및 공증

> **태스크 ID**: P4-T3
> **담당**: frontend-specialist
> **완료 일자**: 2026-02-02

---

## 📋 태스크 요약

macOS 앱 배포를 위한 코드 서명 및 공증(Notarization) 설정을 완료했습니다.

---

## ✅ 완료된 작업

### 1. 문서화

| 파일 | 내용 | 상태 |
|------|------|------|
| `CODE_SIGNING.md` | macOS 코드 서명 및 공증 가이드 | ✅ 완료 |
| `.env.example` | 환경변수 템플릿 | ✅ 완료 |
| `.gitignore` | 민감정보 제외 설정 | ✅ 완료 |
| `BUILD.md` | 코드 서명 섹션 추가 | ✅ 업데이트 |

### 2. 자동화 스크립트

| 파일 | 기능 | 상태 |
|------|------|------|
| `scripts/notarize.js` | electron-builder 공증 훅 | ✅ 완료 |
| `.github/workflows/build-mac.yml` | CI/CD 자동 빌드/서명 | ✅ 완료 |

### 3. 설정 파일

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `electron-builder.yml` | `afterSign: scripts/notarize.js` 추가 | ✅ 업데이트 |
| `package.json` | `@electron/notarize@^2.2.1` 의존성 추가 | ✅ 업데이트 |

---

## 📁 생성된 파일 구조

```
clabs/
├── CODE_SIGNING.md                    # 📘 코드 서명 가이드 (신규)
├── BUILD.md                           # 📝 빌드 가이드 (업데이트)
├── .env.example                       # 📋 환경변수 템플릿 (신규)
├── .gitignore                         # 🔒 민감정보 제외 (신규)
├── electron-builder.yml               # ⚙️  afterSign 훅 추가 (업데이트)
├── package.json                       # 📦 @electron/notarize 추가 (업데이트)
├── scripts/
│   └── notarize.js                    # 🔐 공증 자동화 스크립트 (신규)
└── .github/
    └── workflows/
        └── build-mac.yml              # 🤖 CI/CD 워크플로우 (신규)
```

---

## 🔐 코드 서명 워크플로우

### 로컬 빌드

```
1. .env.local 생성 (템플릿: .env.example)
    ↓
2. 환경변수 설정
    - CSC_NAME (인증서 이름)
    - APPLE_ID (Apple ID)
    - APPLE_APP_SPECIFIC_PASSWORD (앱 전용 암호)
    - APPLE_TEAM_ID (팀 ID)
    ↓
3. npm run build:mac 실행
    ↓
4. electron-builder → 앱 빌드
    ↓
5. 자동 코드 서명 (hardenedRuntime + entitlements)
    ↓
6. scripts/notarize.js 실행 (afterSign 훅)
    ↓
7. Apple에 공증 제출 (notarytool)
    ↓
8. 공증 완료 대기 (5-10분)
    ↓
9. 공증 티켓 자동 스테이플링
    ↓
10. release/*.dmg, *.pkg 생성 완료
```

### CI/CD (GitHub Actions)

```
1. 태그 푸시 (예: git tag v1.0.0 && git push --tags)
    ↓
2. GitHub Actions 트리거
    ↓
3. macOS runner 시작
    ↓
4. 인증서 import (Secrets에서 CERTIFICATE_BASE64)
    ↓
5. Keychain 설정
    ↓
6. npm run build:mac 실행
    ↓
7. 자동 서명 및 공증
    ↓
8. Artifacts 업로드
    ↓
9. GitHub Release 생성 (태그 푸시 시)
    ↓
10. DMG/PKG 파일 배포
```

---

## 📚 CODE_SIGNING.md 주요 섹션

| 섹션 | 내용 |
|------|------|
| **개요** | 코드 서명 필요성 및 Gatekeeper 설명 |
| **사전 준비** | Apple Developer 계정, Xcode CLI Tools |
| **인증서 설정** | Developer ID Application 생성 방법 |
| **환경변수 설정** | .env.local 설정 가이드 |
| **electron-builder 설정** | hardenedRuntime, entitlements 설명 |
| **수동 서명 및 공증** | CLI 명령어로 수동 공증 |
| **CI/CD 환경 설정** | GitHub Actions 워크플로우 |
| **문제 해결** | 자주 발생하는 에러 및 해결책 |

---

## 🔧 주요 설정 파일

### electron-builder.yml

```yaml
# @TASK P4-T3 - 코드 서명 후 자동 공증
afterSign: scripts/notarize.js

mac:
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
```

### scripts/notarize.js

- `@electron/notarize` 사용
- `notarytool` (altool은 deprecated)
- 환경변수 기반 인증
- macOS만 공증 (다른 플랫폼 건너뛰기)

### .github/workflows/build-mac.yml

- `macos-latest` runner
- 인증서 Base64 import
- Keychain 설정 및 잠금 해제
- 자동 빌드/서명/공증
- GitHub Release 자동 생성

---

## 🛡️ 보안 설정

### .gitignore

```gitignore
# 환경변수 (절대 커밋 금지!)
.env
.env.local
.env.*.local

# 인증서 (절대 커밋 금지!)
*.p12
*.cer
*.certSigningRequest
```

### GitHub Secrets

| Secret 이름 | 설명 |
|-------------|------|
| `CERTIFICATE_BASE64` | 인증서 Base64 인코딩 |
| `CERTIFICATE_PASSWORD` | 인증서 비밀번호 |
| `CSC_NAME` | Developer ID Application 이름 |
| `APPLE_ID` | Apple ID |
| `APPLE_APP_SPECIFIC_PASSWORD` | 앱 전용 암호 |
| `APPLE_TEAM_ID` | Team ID |

---

## 🧪 검증 방법

### 로컬 서명 확인

```bash
# 서명 검증
codesign --verify --deep --strict release/mac/clabs.app

# 서명 상세 정보
codesign -dv --verbose=4 release/mac/clabs.app

# Entitlements 확인
codesign -d --entitlements - release/mac/clabs.app

# Gatekeeper 평가
spctl --assess --type execute release/mac/clabs.app
```

### 공증 확인

```bash
# 공증 상태 확인
xcrun notarytool info <submission-id> \
  --apple-id "your.email@example.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID"

# 티켓 검증
xcrun stapler validate release/clabs-1.0.0-mac-x64.dmg
```

---

## 📖 사용자 가이드

### 개발자용 (로컬 빌드)

1. **Apple Developer 가입** ($99/년)
2. **Developer ID Application 인증서 생성**
3. **App-Specific Password 생성**
4. **.env.local 설정**
5. **npm run build:mac 실행**

### CI/CD 담당자용

1. **인증서 Base64 변환**
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```

2. **GitHub Secrets 설정** (6개 항목)

3. **태그 푸시로 자동 빌드**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

---

## 🎯 체크리스트

- [x] CODE_SIGNING.md 문서 작성
- [x] .env.example 템플릿 생성
- [x] .gitignore 보안 설정
- [x] scripts/notarize.js 공증 스크립트
- [x] electron-builder.yml afterSign 훅 연결
- [x] package.json @electron/notarize 의존성 추가
- [x] .github/workflows/build-mac.yml CI/CD 워크플로우
- [x] BUILD.md 코드 서명 섹션 추가

---

## 📦 의존성 추가

```json
{
  "devDependencies": {
    "@electron/notarize": "^2.2.1"
  }
}
```

---

## 🔗 참고 문서

- [CODE_SIGNING.md](CODE_SIGNING.md) - 상세 가이드
- [BUILD.md](BUILD.md) - 빌드 가이드
- [electron-builder 공식 문서](https://www.electron.build/code-signing)
- [Apple Developer: Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

---

## 📝 TAG 시스템

모든 파일에 다음 TAG 추가됨:

```typescript
// @TASK P4-T3 - Mac 앱 코드 서명 및 공증
// @SPEC Phase 4: 패키징 및 배포 - 코드 서명 및 보안
```

---

## ✅ 완료 상태

**상태**: ✅ 완료
**다음 단계**: P4-T4 (Windows 코드 서명 설정)

---

**작성자**: frontend-specialist (Claude Code)
**작성일**: 2026-02-02
**버전**: 1.0.0
