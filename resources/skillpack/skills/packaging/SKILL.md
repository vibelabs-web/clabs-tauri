---
name: packaging
description: Claude Labs 스킬팩 + Clabs GUI 앱 통합 패키징. Mac/Windows 별도 ZIP 패키지 생성. "패키징해줘" 키워드에 반응.
---

# Packaging: 스킬팩 + GUI 앱 통합 패키징

> "스킬팩과 Clabs 앱을 플랫폼별 배포 패키지로 분리"

---

## 트리거 키워드

- "패키징해줘"
- "패키징"
- "/packaging"
- "배포 패키징"

---

## ⛔ 마크다운 작성 규칙

> **표(테이블) 형식 절대 금지! 렌더링이 깨집니다.**

**사용 금지:**
```markdown
| 항목 | 설명 |
|------|------|
| A | B |
```

**대신 사용:**
```markdown
## 항목

- `A` - 설명
- `B` - 설명
```

---

## 핵심 개념: 플랫폼별 분리 배포

```
┌─────────────────────────────────────────────────────────────────┐
│  Claude Labs 플랫폼별 배포 패키지                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📦 Mac용 패키지:                                                │
│  Claude-Labs-v{VERSION}-Mac.zip                                 │
│  ├── Claude-Labs-v{VERSION}-Mac.dmg     # 설치 프로그램         │
│  ├── install.sh                         # 스크립트 (fallback)   │
│  ├── README.md                                                  │
│  └── CHANGELOG.md                                               │
│                                                                 │
│  📦 Windows용 패키지:                                            │
│  Claude-Labs-v{VERSION}-Windows.zip                             │
│  ├── Claude-Labs-v{VERSION}-Setup.exe   # 설치 프로그램         │
│  ├── install.ps1                        # 스크립트 (fallback)   │
│  ├── README.md                                                  │
│  └── CHANGELOG.md                                               │
│                                                                 │
│  💡 설치: exe/dmg 실행 (실패 시 스크립트로 수동 설치)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ 패키징 전체 워크플로우 (반드시 순서대로!)

```
┌─────────────────────────────────────────────────────────────────┐
│  "패키징해줘" 실행 시 반드시 다음 7단계를 모두 수행!              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 버전 확인 (AskUserQuestion 필수!)                      │
│     └── 현재 버전 확인 → 사용자에게 버전업 여부 질문            │
│                                                                 │
│  Step 2: 버전 파일 업데이트 (버전 변경 시만)                    │
│     └── README.md, CHANGELOG.md, install.sh, install.ps1       │
│     └── clabs/package.json (앱 버전도 동기화!)                  │
│                                                                 │
│  Step 3: 전역 스킬팩 설치                                       │
│     └── rsync -av --delete .claude/ ~/.claude/                 │
│                                                                 │
│  Step 4: Clabs GUI 앱 빌드                                      │
│     └── Mac: CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac│
│     └── Windows: npm run build:win                             │
│                                                                 │
│  Step 5: 플랫폼별 ZIP 패키지 생성                               │
│     └── Mac용: Claude-Labs-v{VERSION}-Mac.zip                  │
│     └── Windows용: Claude-Labs-v{VERSION}-Windows.zip          │
│                                                                 │
│  ⭐⭐⭐ Step 6: 패키징 MD 파일 생성 (8개) - 무조건 실행! ⭐⭐⭐   │
│     └── packaging/ 폴더에 01~08 파일 생성                      │
│     └── ⛔ 버전 유지/변경 상관없이 반드시 실행!                 │
│     └── ⛔ 내용이 바뀔 수 있으므로 절대 건너뛰지 말 것!        │
│                                                                 │
│  Step 7: 완료 보고                                              │
│     └── 패키지 파일 경로 및 크기 출력                          │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│  ⛔ 중요: Step 6은 어떤 경우에도 건너뛰면 안 됨!                │
│  ⛔ 버전 유지를 선택해도 MD 파일은 무조건 새로 작성!           │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### ⛔ 절대 규칙: MD 파일 생성은 무조건!

> **버전을 유지하더라도 스킬/에이전트/Constitution 내용이 변경될 수 있습니다.**
> **따라서 Step 6 (패키징 MD 파일 생성)은 어떤 경우에도 실행해야 합니다!**

---

## Step 1: 버전 확인 (AskUserQuestion 필수!)

### 1-1. 현재 버전 추출

```bash
# README.md에서 현재 버전 추출
VERSION=$(grep -m1 "버전" README.md | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
echo "현재 버전: $VERSION"

# clabs/package.json 버전도 확인
APP_VERSION=$(grep '"version"' clabs/package.json | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
echo "앱 버전: $APP_VERSION"
```

### 1-2. AskUserQuestion 실행 (⭐ 필수!)

> **반드시 AskUserQuestion 도구를 사용하여 버전을 확인합니다.**

```json
{
  "questions": [{
    "question": "현재 버전은 v{현재버전}입니다. 패키징할 버전을 선택해주세요:",
    "header": "버전 확인",
    "options": [
      {"label": "v{현재버전} 유지", "description": "현재 버전 그대로 패키징 (MD 파일은 재생성)"},
      {"label": "v{X.Y.Z+1} Patch", "description": "버그 수정 (예: 1.8.2 → 1.8.3)"},
      {"label": "v{X.Y+1.0} Minor", "description": "새 기능 추가 (예: 1.8.2 → 1.9.0)"},
      {"label": "v{X+1.0.0} Major", "description": "호환성 변경 (예: 1.8.2 → 2.0.0)"}
    ],
    "multiSelect": false
  }]
}
```

### ⚠️ 버전 유지 선택 시 주의사항

> **"버전 유지"를 선택해도 Step 6 (MD 파일 생성)은 반드시 실행합니다!**
> - Step 2 (버전 파일 업데이트)만 건너뜁니다
> - Step 3~7은 모두 정상 실행합니다

---

## Step 2: 버전 파일 업데이트

> **버전 변경이 있을 때만 실행 (유지 선택 시 건너뜀)**

```bash
# 버전 변경 시 다음 5개 파일 업데이트:

# 1. README.md
Edit: **버전**: {OLD} → **버전**: {NEW}

# 2. CHANGELOG.md (새 버전 섹션 추가)
# 맨 위에 새 버전 섹션 추가

# 3. install.sh
Edit: VERSION="{OLD}" → VERSION="{NEW}"

# 4. install.ps1
Edit: $VERSION = "{OLD}" → $VERSION = "{NEW}"

# 5. clabs/package.json (앱 버전!)
Edit: "version": "{OLD}" → "version": "{NEW}"
```

---

## Step 3: 전역 스킬팩 설치

```bash
rsync -av --delete .claude/ ~/.claude/
```

---

## Step 4: Clabs GUI 앱 빌드

### 4-1. Mac 빌드 (서명 비활성화)

```bash
cd clabs
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac
```

### 4-2. Windows 빌드

```bash
cd clabs
npm run build:win
```

### 4-3. 빌드 결과물 확인

```
clabs/release/
├── Clabs-{VERSION}-arm64.dmg          # Mac DMG
├── Clabs-{VERSION}-arm64-mac.zip      # Mac ZIP
├── Clabs Setup {VERSION}.exe          # Windows 인스톨러
└── Clabs-{VERSION}-arm64-win.zip      # Windows 포터블
```

---

## Step 5: 플랫폼별 ZIP 패키지 생성

> **각 플랫폼용 ZIP에는 설치 프로그램 + 스크립트(fallback) 동봉**

### 5-1. dist 폴더 준비

```bash
rm -rf dist/
mkdir -p dist/
```

### 5-2. Mac용 ZIP 생성

```bash
VERSION="1.8.2"  # 확정된 버전

# Mac 패키지 생성
cd dist
mkdir -p mac-package
cp ../clabs/release/Clabs-${VERSION}-arm64.dmg mac-package/Claude-Labs-v${VERSION}-Mac.dmg
cp ../install.sh mac-package/
cp ../README.md mac-package/
cp ../CHANGELOG.md mac-package/

# ZIP 압축
cd mac-package
zip -r "../Claude-Labs-v${VERSION}-Mac.zip" .
cd ..
rm -rf mac-package
```

### 5-3. Windows용 ZIP 생성

```bash
VERSION="1.8.2"  # 확정된 버전

# Windows 패키지 생성
cd dist
mkdir -p win-package
cp "../clabs/release/Clabs Setup ${VERSION}.exe" win-package/Claude-Labs-v${VERSION}-Setup.exe
cp ../install.ps1 win-package/
cp ../README.md win-package/
cp ../CHANGELOG.md win-package/

# ZIP 압축
cd win-package
zip -r "../Claude-Labs-v${VERSION}-Windows.zip" .
cd ..
rm -rf win-package
```

### 5-4. 최종 구조

```
dist/
├── Claude-Labs-v{VERSION}-Mac.zip
│   ├── Claude-Labs-v{VERSION}-Mac.dmg   # Mac 설치 프로그램
│   ├── install.sh                       # 스크립트 (fallback)
│   ├── README.md
│   └── CHANGELOG.md
│
└── Claude-Labs-v{VERSION}-Windows.zip
    ├── Claude-Labs-v{VERSION}-Setup.exe # Windows 설치 프로그램
    ├── install.ps1                      # 스크립트 (fallback)
    ├── README.md
    └── CHANGELOG.md
```

---

## Step 6: 패키징 MD 파일 생성 (⛔ 무조건 실행 - 절대 건너뛰지 말 것!)

> **⛔⛔⛔ 이 단계는 버전 유지/변경과 무관하게 반드시 실행해야 합니다! ⛔⛔⛔**
>
> **이유: 버전이 같아도 스킬, 에이전트, Constitution 내용이 변경될 수 있음!**

### 6-1. 핵심 문서 읽기

```bash
Read README.md      # 버전, 주요 기능
Read CHANGELOG.md   # 변경사항
Read WORKFLOW.md    # 워크플로우
```

### 6-2. 스킬/에이전트/Constitution 스캔

```bash
Glob ".claude/skills/*/SKILL.md"  # packaging 제외!
Glob ".claude/agents/*.md"
Glob ".claude/constitutions/**/*.md"
```

### 6-3. 8개 파일 생성 (폴더: packaging/)

```
packaging/
├── 01-basic-info.md       # 기본 정보 (버전, 설명)
├── 02-installation.md     # 설치 방법 (Mac/Windows 분리)
├── 03-workflow.md         # 워크플로우
├── 04-contents.md         # 포함 내용 (스킬팩 + 앱)
├── 05-quickstart.md       # 빠른 시작
├── 06-requirements.md     # 요구사항
├── 07-mcp-settings.md     # MCP 설정
└── 08-troubleshooting.md  # 문제 해결
```

---

## Step 7: 완료 보고

### 필수 출력 형식

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 패키징 완료! (v{VERSION})                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📁 Mac용 패키지:                                                │
│     └── dist/Claude-Labs-v{VERSION}-Mac.zip ({SIZE}MB)         │
│         ├── Claude-Labs-v{VERSION}-Mac.dmg (설치 프로그램)      │
│         └── install.sh (스크립트 fallback)                      │
│                                                                 │
│  📁 Windows용 패키지:                                            │
│     └── dist/Claude-Labs-v{VERSION}-Windows.zip ({SIZE}MB)     │
│         ├── Claude-Labs-v{VERSION}-Setup.exe (설치 프로그램)    │
│         └── install.ps1 (스크립트 fallback)                     │
│                                                                 │
│  📝 패키징 MD 파일 (8개):                                        │
│     └── packaging/01~08-*.md                                   │
│                                                                 │
│  💡 배포 안내:                                                   │
│     - Mac 사용자: Claude-Labs-v{VERSION}-Mac.zip 배포          │
│     - Windows 사용자: Claude-Labs-v{VERSION}-Windows.zip 배포  │
│     - 설치: DMG/EXE 실행 (실패 시 스크립트로 수동 설치)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 설치 방법 안내 (사용자용)

### Mac 설치

```bash
# 1. ZIP 압축 해제
unzip Claude-Labs-v{VERSION}-Mac.zip

# 2. DMG 실행 (권장)
open Claude-Labs-v{VERSION}-Mac.dmg
# → Clabs.app을 Applications로 드래그

# 3. DMG 실패 시 스크립트 사용
chmod +x install.sh
./install.sh
```

### Windows 설치

```powershell
# 1. ZIP 압축 해제
Expand-Archive Claude-Labs-v{VERSION}-Windows.zip

# 2. EXE 실행 (권장)
.\Claude-Labs-v{VERSION}-Setup.exe

# 3. EXE 실패 시 스크립트 사용 (관리자 권한 PowerShell)
.\install.ps1
```

---

## 배포에서 제외되는 항목

```bash
# ZIP 패키징 시 제외
-x ".claude/skills/packaging/*"   # 패키징 스킬 (개발용)
-x "packaging/*"                  # 패키징 MD 파일 (VibeLabs DB용)
-x "*.DS_Store"
-x "*__pycache__*"
-x "*.git*"
-x "*node_modules*"
```

---

## 파일 템플릿: 02-installation.md

```markdown
## 설치 방법

### Mac 설치

**방법 1: DMG 설치 프로그램 (권장)**

1. `Claude-Labs-v{VERSION}-Mac.zip` 압축 해제
2. `Claude-Labs-v{VERSION}-Mac.dmg` 더블 클릭
3. Clabs.app을 Applications 폴더로 드래그

**방법 2: 스크립트 설치 (DMG 실패 시)**

\`\`\`bash
chmod +x install.sh
./install.sh
\`\`\`

### Windows 설치

**방법 1: EXE 설치 프로그램 (권장)**

1. `Claude-Labs-v{VERSION}-Windows.zip` 압축 해제
2. `Claude-Labs-v{VERSION}-Setup.exe` 실행
3. 설치 마법사 따라 진행

**방법 2: 스크립트 설치 (EXE 실패 시)**

\`\`\`powershell
# 관리자 권한 PowerShell에서 실행
.\install.ps1
\`\`\`

### 설치 확인

\`\`\`bash
# Claude Code에서 스킬 확인
claude
> /help
\`\`\`
```

---

## Reference 파일

- `file-templates.md` - 각 파일별 상세 템플릿
