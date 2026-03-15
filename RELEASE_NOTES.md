# Claude Labs Skillpack GUI - Release Notes

<!-- @TASK P4-T4 - 릴리즈 노트 템플릿 -->
<!-- @SPEC docs/planning/04-phase-4-build.md#릴리즈-준비 -->

## What's New

### Features

- **스킬팩 시각적 관리**: 드래그 앤 드롭으로 스킬팩 설치/제거
- **통합 터미널**: Electron 앱 내에서 Claude Code CLI 실행
- **MCP 서버 관리**: Gemini, Stitch, Context7 MCP 서버 통합 제어
- **설정 동기화**: 프로젝트별 Claude 설정 실시간 편집

### Improvements

- 성능 최적화: 메인 프로세스 IPC 통신 개선
- UI/UX: 다크모드 + 네온 강조색 MOVIN 디자인 시스템 적용
- 접근성: WCAG AA 준수, 키보드 네비게이션 지원

### Bug Fixes

- 터미널 렌더링 깜빡임 현상 수정
- Windows에서 파일 경로 이슈 해결
- macOS Gatekeeper 서명 문제 해결

---

## Installation

### macOS

```bash
# DMG 다운로드 후
open clabs-1.0.0.dmg
# Applications 폴더로 드래그 앤 드롭
```

### Windows

```powershell
# NSIS 인스톨러 실행
clabs-Setup-1.0.0.exe
```

### Linux

```bash
# AppImage
chmod +x clabs-1.0.0.AppImage
./clabs-1.0.0.AppImage

# .deb (Debian/Ubuntu)
sudo dpkg -i clabs_1.0.0_amd64.deb
```

---

## System Requirements

| Platform | Minimum |
|----------|---------|
| **macOS** | 10.15 (Catalina) |
| **Windows** | Windows 10 (64-bit) |
| **Linux** | Ubuntu 20.04 LTS |
| **Node.js** | 18.x or later |

---

## Auto-Update

이 버전부터 자동 업데이트가 지원됩니다:

- 앱 시작 시 자동으로 업데이트 확인
- 백그라운드에서 다운로드
- 다음 실행 시 자동 적용

---

## Troubleshooting

### macOS: "앱을 열 수 없습니다" 경고

```bash
xattr -cr /Applications/clabs.app
```

### Windows: SmartScreen 경고

"추가 정보" → "실행" 클릭

### Linux: AppImage 실행 안 됨

```bash
sudo apt install libfuse2
```

---

## Contributing

버그 리포트 및 기능 제안: [GitHub Issues](https://github.com/yourusername/clabs/issues)

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

**Full Changelog**: https://github.com/yourusername/clabs/compare/v0.9.0...v1.0.0
