# 릴리즈 체크리스트

<!-- @TASK P4-T4 - 릴리즈 체크리스트 -->
<!-- @SPEC docs/planning/04-phase-4-build.md#릴리즈-준비 -->

## 사전 준비

- [ ] 모든 Phase 태스크 완료
- [ ] 테스트 커버리지 80% 이상
- [ ] E2E 테스트 통과
- [ ] 접근성 검증 완료 (axe-core)

## 버전 업데이트

- [ ] `package.json` 버전 번호 업데이트
- [ ] `CHANGELOG.md` 업데이트
- [ ] `RELEASE_NOTES.md` 작성

## 빌드 테스트

### macOS

```bash
npm run build:mac

# DMG 설치 테스트
open release/clabs-1.0.0.dmg

# 자동 업데이트 테스트
# 1. v0.9.0 설치
# 2. v1.0.0 릴리즈 후 업데이트 확인
```

- [ ] DMG 설치 성공
- [ ] 앱 실행 성공
- [ ] 자동 업데이트 동작 확인
- [ ] Gatekeeper 통과 (코드 서명)

### Windows

```powershell
npm run build:win

# NSIS 인스톨러 테스트
.\release\clabs-Setup-1.0.0.exe
```

- [ ] NSIS 인스톨러 실행 성공
- [ ] 앱 실행 성공
- [ ] 자동 업데이트 동작 확인
- [ ] SmartScreen 통과

### Linux

```bash
npm run build:linux

# AppImage 테스트
chmod +x release/clabs-1.0.0.AppImage
./release/clabs-1.0.0.AppImage

# .deb 테스트 (Ubuntu/Debian)
sudo dpkg -i release/clabs_1.0.0_amd64.deb
```

- [ ] AppImage 실행 성공
- [ ] .deb 설치 성공
- [ ] 앱 실행 성공

## GitHub 설정

- [ ] GitHub Personal Access Token 생성 (권한: `repo`, `write:packages`)
- [ ] GitHub Actions Secrets 등록: `GH_TOKEN`
- [ ] `package.json`의 `publish.owner`, `publish.repo` 업데이트

## 릴리즈

### Git 태그 생성

```bash
# 버전 태그 생성
git tag v1.0.0

# 태그 푸시 (자동으로 GitHub Actions 트리거)
git push origin v1.0.0
```

- [ ] Git 태그 생성
- [ ] 태그 푸시

### GitHub Actions 확인

- [ ] macOS 빌드 성공
- [ ] Windows 빌드 성공
- [ ] Linux 빌드 성공
- [ ] GitHub Release 자동 생성 확인

### 수동 릴리즈 (GitHub Actions 없을 때)

```bash
# 전체 플랫폼 빌드
npm run build:all

# GitHub CLI로 릴리즈
gh release create v1.0.0 \
  release/*.dmg \
  release/*.zip \
  release/*.exe \
  release/*.AppImage \
  release/*.deb \
  --title "v1.0.0" \
  --notes-file RELEASE_NOTES.md
```

## 릴리즈 후 확인

- [ ] GitHub Releases 페이지에 에셋 업로드 확인
- [ ] 각 플랫폼별 다운로드 테스트
- [ ] 자동 업데이트 서버 동작 확인

### 자동 업데이트 테스트 시나리오

1. **이전 버전 설치** (예: v0.9.0)
2. **새 버전 릴리즈** (예: v1.0.0)
3. **앱 실행** → "업데이트 사용 가능" 알림 확인
4. **다운로드** → 진행률 표시 확인
5. **재시작** → 새 버전으로 업데이트 확인

## 문서 업데이트

- [ ] README.md 업데이트
- [ ] 다운로드 링크 업데이트
- [ ] 스크린샷 업데이트 (변경 사항 있을 때)

## 배포 공지

- [ ] GitHub Discussions 또는 Issue 공지
- [ ] 소셜 미디어 공유 (선택)
- [ ] 사용자에게 업데이트 안내 메일 (선택)

---

## 롤백 절차 (문제 발생 시)

```bash
# 릴리즈 삭제
gh release delete v1.0.0 --yes

# 태그 삭제
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# 이전 버전으로 롤백
gh release create v0.9.0 --latest
```

---

## 참고 링크

- [electron-builder 문서](https://www.electron.build/)
- [electron-updater 가이드](https://www.electron.build/auto-update)
- [GitHub Actions 워크플로우](https://docs.github.com/en/actions)
- [코드 서명 가이드](https://www.electron.build/code-signing)
