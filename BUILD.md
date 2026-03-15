# 빌드 가이드

> **@TASK P4-T2** - electron-builder 크로스 플랫폼 빌드 설정

## 빌드 명령어

### 전체 플랫폼 빌드

```bash
# 모든 플랫폼 빌드 (macOS, Windows, Linux)
npm run build:all
```

### 플랫폼별 빌드

```bash
# macOS만 빌드 (DMG + PKG)
npm run build:mac

# Windows만 빌드 (NSIS + Portable)
npm run build:win

# Linux만 빌드 (AppImage + DEB)
npm run build:linux
```

### 기본 빌드

```bash
# 현재 플랫폼만 빌드
npm run build
```

## 빌드 출력 파일

### macOS

```
release/
├── clabs-1.0.0-mac-x64.dmg          # 디스크 이미지 (드래그 앤 드롭 설치)
├── clabs-1.0.0-mac-x64.pkg          # 인스톨러 패키지
└── clabs-1.0.0-mac-x64.dmg.blockmap
```

### Windows

```
release/
├── clabs-1.0.0-win-x64.exe          # NSIS 인스톨러
├── clabs-1.0.0-portable.exe         # 포터블 실행 파일
└── clabs-1.0.0-win-x64.exe.blockmap
```

### Linux

```
release/
├── clabs-1.0.0-linux-x64.AppImage   # 범용 실행 파일
├── clabs-1.0.0-linux-amd64.deb      # Debian/Ubuntu 패키지
└── clabs-1.0.0-linux-x64.AppImage.blockmap
```

## 빌드 전 요구사항

### 공통

- Node.js 18+ 설치
- npm 또는 yarn 설치
- 모든 의존성 설치: `npm install`

### macOS 빌드 시

- macOS 운영체제 필수
- Xcode Command Line Tools 설치
- 코드 서명 인증서 (선택사항)

### Windows 빌드 시

- Windows 운영체제 또는 Wine (Linux/macOS에서 크로스 빌드)
- NSIS 3.08+ (electron-builder가 자동 다운로드)

### Linux 빌드 시

- Linux 운영체제 또는 Docker
- `fuse` 패키지 설치 (AppImage 실행용)

## 빌드 리소스

빌드에 필요한 리소스는 `build/` 디렉토리에 위치합니다:

```
build/
├── icon.icns                    # macOS 아이콘 (512x512 이상)
├── icon.ico                     # Windows 아이콘 (256x256 이상)
├── icon.png                     # Linux 아이콘 (512x512 PNG)
├── entitlements.mac.plist       # macOS 앱 권한 설정
├── dmg-background.png           # DMG 배경 이미지 (540x380)
└── linux/
    ├── after-install.sh         # Debian 설치 후 스크립트
    └── after-remove.sh          # Debian 제거 후 스크립트
```

**주의**: 아이콘 파일은 별도로 준비해야 합니다. `build/README.md`를 참조하세요.

## 크로스 플랫폼 빌드

electron-builder는 제한적인 크로스 빌드를 지원합니다:

| 호스트 OS | 빌드 가능 타겟 |
|-----------|---------------|
| macOS | macOS, Windows, Linux |
| Windows | Windows, Linux |
| Linux | Linux, Windows (Wine 필요) |

### Docker를 이용한 Linux 빌드 (macOS/Windows에서)

```bash
docker run --rm -ti \
  --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}:/project \
  -v ${PWD##*/}-node-modules:/project/node_modules \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "npm install && npm run build:linux"
```

## 코드 서명

> **@TASK P4-T3** - 상세한 코드 서명 가이드는 [CODE_SIGNING.md](CODE_SIGNING.md) 참조

### macOS

```bash
# 1. .env.local 파일 생성 (.env.example 참조)
cp .env.example .env.local

# 2. 환경 변수 설정
CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"
APPLE_ID="your-apple-id@email.com"
APPLE_APP_SPECIFIC_PASSWORD="abcd-efgh-ijkl-mnop"
APPLE_TEAM_ID="ABCDEF1234"

# 3. 빌드 (자동으로 서명 및 공증)
npm run build:mac
```

**공증 과정**:
- 빌드 후 자동으로 Apple에 공증 제출
- 완료까지 5-10분 소요
- 공증 완료 후 티켓 자동 스테이플링

**서명 확인**:
```bash
# 서명 검증
codesign --verify --deep --strict release/mac/clabs.app

# 공증 확인
spctl --assess --type execute release/mac/clabs.app
```

### Windows

```bash
# 환경 변수 설정
export WIN_CSC_LINK="/path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"

# 빌드
npm run build:win
```

## 자동 업데이트

electron-updater가 설정되어 있으며, GitHub Releases를 통해 자동 업데이트가 가능합니다.

### GitHub Release 배포

```bash
# 1. 빌드
npm run build:all

# 2. GitHub 토큰 설정
export GH_TOKEN="github-personal-access-token"

# 3. 배포
npm run build -- --publish always
```

## 문제 해결

### "Cannot find module 'electron'"

```bash
npm install --save-dev electron
```

### "Application not signed"

macOS에서 서명되지 않은 앱은 Gatekeeper에 의해 차단됩니다. 해결 방법:

1. **임시 해결**: 시스템 환경설정 > 보안 및 개인정보 보호 > "확인 없이 열기"
2. **영구 해결**: Apple Developer 인증서로 코드 서명

### "wine: command not found"

Windows 크로스 빌드를 위해 Wine 설치:

```bash
# macOS
brew install wine-stable

# Linux (Ubuntu/Debian)
sudo apt install wine-stable
```

### 빌드 캐시 제거

```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# electron-builder 캐시 제거
rm -rf ~/.cache/electron
rm -rf ~/.cache/electron-builder
```

## 참고 문서

- [electron-builder 공식 문서](https://www.electron.build/)
- [Code Signing 가이드](https://www.electron.build/code-signing)
- [Auto Update 설정](https://www.electron.build/auto-update)
- [Multi Platform Build](https://www.electron.build/multi-platform-build)
