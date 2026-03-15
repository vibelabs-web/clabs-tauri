# GitHub Actions 워크플로우

<!-- @TASK P4-T4 - GitHub Actions 워크플로우 -->
<!-- @SPEC docs/planning/04-phase-4-build.md#릴리즈-준비 -->

## 자동 릴리즈 워크플로우

`.github/workflows/release.yml`은 Git 태그 푸시 시 자동으로 실행됩니다.

### 트리거 조건

```bash
git tag v1.0.0
git push origin v1.0.0
```

`v*.*.*` 형식의 태그가 푸시되면 자동으로 릴리즈 프로세스가 시작됩니다.

---

## 워크플로우 단계

### 1. 멀티 플랫폼 빌드

3개의 OS에서 동시에 빌드:

- **macOS**: DMG, ZIP
- **Windows**: NSIS 인스톤러, ZIP
- **Linux**: AppImage, .deb

### 2. 아티팩트 업로드

각 플랫폼별 빌드 결과물을 GitHub Actions Artifacts에 업로드합니다.

### 3. GitHub Release 생성

모든 빌드가 완료되면:

1. 아티팩트를 다운로드
2. `RELEASE_NOTES.md`를 릴리즈 노트로 사용
3. GitHub Release 자동 생성
4. 모든 바이너리 첨부

---

## 사전 준비

### GitHub Personal Access Token

1. GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. 권한 선택:
   - `repo` (전체)
   - `write:packages`
4. 토큰 복사

### Secrets 등록

Repository Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|------|-------|
| `GH_TOKEN` | 위에서 생성한 Personal Access Token |

### package.json 수정

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "YOUR_GITHUB_USERNAME",
      "repo": "clabs"
    }
  }
}
```

`YOUR_GITHUB_USERNAME`을 실제 GitHub 사용자명으로 변경하세요.

---

## 로컬 테스트

GitHub Actions를 푸시하기 전에 로컬에서 테스트:

```bash
# 전체 플랫폼 빌드 (시간이 오래 걸림)
npm run build:all

# 현재 OS만 빌드
npm run build:mac   # macOS
npm run build:win   # Windows
npm run build:linux # Linux
```

---

## 수동 릴리즈 (대안)

GitHub Actions를 사용하지 않고 수동으로 릴리즈:

```bash
# 1. 빌드
npm run build:all

# 2. GitHub CLI로 릴리즈
gh release create v1.0.0 \
  release/*.dmg \
  release/*.zip \
  release/*.exe \
  release/*.AppImage \
  release/*.deb \
  --title "v1.0.0" \
  --notes-file RELEASE_NOTES.md
```

---

## 자동 업데이트 서버

electron-updater는 GitHub Releases를 자동 업데이트 서버로 사용합니다.

### 동작 방식

1. 앱 시작 시 `latest-mac.yml`, `latest.yml`, `latest-linux.yml` 확인
2. 현재 버전과 비교
3. 새 버전이 있으면 사용자에게 알림
4. 다운로드 → 재시작 → 자동 설치

### 업데이트 파일

릴리즈 시 자동 생성:

- **macOS**: `latest-mac.yml`
- **Windows**: `latest.yml`
- **Linux**: `latest-linux.yml`

---

## 문제 해결

### Actions 실패 시

1. GitHub Actions 탭에서 로그 확인
2. 빌드 에러 확인
3. Secrets 설정 확인

### 릴리즈 삭제

```bash
gh release delete v1.0.0 --yes
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

---

## 참고 링크

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [electron-builder CI 가이드](https://www.electron.build/configuration/configuration)
- [electron-updater 문서](https://www.electron.build/auto-update)
