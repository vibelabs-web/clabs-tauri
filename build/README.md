# Build Resources

이 디렉토리는 electron-builder가 빌드 시 사용하는 리소스 파일을 포함합니다.

## 필수 파일

### 아이콘 파일

| 파일 | 플랫폼 | 권장 크기 |
|------|--------|----------|
| `icon.icns` | macOS | 512x512 이상 |
| `icon.ico` | Windows | 256x256 이상 |
| `icon.png` | Linux | 512x512 PNG |

### macOS 전용

- `entitlements.mac.plist` - macOS 앱 권한 설정
- `dmg-background.png` - DMG 배경 이미지 (540x380)

### Linux 전용

- `linux/after-install.sh` - 설치 후 스크립트
- `linux/after-remove.sh` - 제거 후 스크립트

## 아이콘 생성 방법

### macOS (.icns)

```bash
# png2icns 설치 필요
brew install libicns

# 512x512 PNG에서 변환
png2icns icon.icns icon-512.png
```

### Windows (.ico)

```bash
# ImageMagick 사용
convert icon-256.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Linux (.png)

512x512 PNG 파일을 그대로 사용하면 됩니다.

## 현재 상태

- [ ] icon.icns (macOS)
- [ ] icon.ico (Windows)
- [ ] icon.png (Linux)
- [ ] entitlements.mac.plist
- [ ] dmg-background.png
- [ ] linux/after-install.sh
- [ ] linux/after-remove.sh

## 참고

자세한 내용은 [electron-builder 공식 문서](https://www.electron.build/)를 참조하세요.
