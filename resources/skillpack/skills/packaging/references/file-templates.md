# 패키징 파일 템플릿

> 각 파일별 상세 템플릿 및 작성 지침

---

## 01-basic-info.md 템플릿

```markdown
---
version: "X.Y.Z"
tagline: "아이디어만으로 풀스택 웹앱을 완성하는 AI 개발 파트너"
author: "VibeLabs"
updated: "YYYY-MM-DD"
---

## 설명

Claude Labs는 Claude Code를 위한 AI 에이전트 팀 + 개발 자동화 스킬 모음입니다.
아이디어 구상부터 기획, 설계, 개발, 테스트까지 전 과정을 AI가 함께합니다.

## 주요 특징

- 소크라테스식 1:1 기획 컨설팅 (/socrates)
- 화면별 상세 명세 자동 생성 (/screen-spec)
- 의존성 기반 자동 개발 (/auto-orchestrate)
- 16개 전문가 에이전트 협업
```

### 작성 지침

- version: README.md에서 추출
- tagline: 20자 이내 한 줄 설명
- updated: 패키징 실행일 (YYYY-MM-DD 형식)
- 설명: 3~5문장으로 핵심 가치 전달
- 주요 특징: 3~5개 핵심 기능

---

## 02-installation.md 템플릿

```markdown
## 방법 1: TUI 인터랙티브 설치 (권장)

스킬 카테고리와 MCP 서버를 선택적으로 설치할 수 있습니다.

**Mac/Linux:**
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/vibelabs/claude-labs/main/install.sh | bash
\`\`\`

**Windows (PowerShell - 관리자 권한):**
\`\`\`powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
irm https://raw.githubusercontent.com/vibelabs/claude-labs/main/install.ps1 | iex
\`\`\`

## 방법 2: Claude Code에 맡기기

Claude Code 실행 후 다음과 같이 요청:
\`\`\`
"Claude Labs 스킬팩을 설치해줘"
"https://vibelabs.kr/skills/download/... 에서 다운로드해서 설치해줘"
\`\`\`

## 방법 3: 수동 설치

ZIP 파일 다운로드 후:

**Mac/Linux:**
\`\`\`bash
unzip claude-labs-vX.Y.Z.zip
rsync -av --delete .claude/ ~/.claude/
\`\`\`

**Windows (PowerShell):**
\`\`\`powershell
Expand-Archive claude-labs-vX.Y.Z.zip -DestinationPath .
Copy-Item -Recurse -Force .\.claude\* $env:USERPROFILE\.claude\
\`\`\`
```

### 작성 지침

- 3가지 방법 모두 포함
- TUI 설치를 "권장"으로 표시
- 플랫폼별 명령어 분리
- 버전 번호는 X.Y.Z 형식 유지 (사용자가 교체)

---

## 03-workflow.md 템플릿

```markdown
## 전체 워크플로우

\`\`\`
/neurion ──→ /socrates ──→ /screen-spec ──→ /tasks-generator ──→ /auto-orchestrate
    │            │              │                 │                    │
    ▼            ▼              ▼                 ▼                    ▼
브레인스토밍   기획 대화      화면 명세         태스크 생성         자동 개발
(선택적)     (21개 질문)   (YAML v2.0)       (TASKS.md)        (에이전트 협업)
\`\`\`

## 단계별 설명

### 1. /neurion (선택)
AI와 함께 아이디어를 브레인스토밍합니다.

### 2. /socrates
소크라테스식 질문으로 핵심 기능과 화면을 도출합니다.

### 3. /screen-spec
각 화면의 상세 명세를 YAML 형식으로 생성합니다.

### 4. /tasks-generator
화면 명세를 기반으로 TASKS.md를 생성합니다.

### 5. /auto-orchestrate
의존성을 분석하여 에이전트들이 자동으로 개발합니다.
```

### 작성 지침

- ASCII 다이어그램으로 흐름 시각화
- 각 단계 간단한 설명 (1~2문장)
- WORKFLOW.md에서 다이어그램 추출

---

## 04-contents.md 템플릿

> **주의: 표(테이블) 형식 사용 금지! 코드 블럭 또는 개조식으로 작성**

```markdown
## 스킬 (XX개)

### Core
- `/socrates` - 소크라테스식 1:1 기획 컨설팅
- `/screen-spec` - 화면별 상세 명세 생성
- `/tasks-generator` - TASKS.md 생성

### Orchestration
- `/auto-orchestrate` - 의존성 기반 자동 실행
- `/orchestrate` - 수동 오케스트레이션

### Quality
- `/trinity` - 코드 품질 평가
- `/code-review` - 2단계 코드 리뷰

### Utility
- `/memory` - 세션 간 학습 지속
- `/deep-research` - 종합 리서치

---

## 에이전트 (XX개)

### 구현 에이전트
- `frontend-specialist` - 프론트엔드 개발
- `backend-specialist` - 백엔드 개발
- `3d-engine-specialist` - 3D 엔진/Three.js

### 분석/설계 에이전트
- `architecture-analyst` - 아키텍처 분석
- `requirements-analyst` - 요구사항 분석

---

## Constitutions (XX개)

- `fastapi.md` - FastAPI 프레임워크 규칙
- `nextjs.md` - Next.js 프레임워크 규칙
- `supabase.md` - Supabase 프레임워크 규칙
```

### 작성 지침

- .claude/skills/, agents/, constitutions/ 스캔
- **테이블 사용 금지** → 개조식(`- 항목`)으로 정리
- 개수 자동 계산하여 표시

---

## 05-quickstart.md 템플릿

```markdown
## 시나리오별 빠른 시작

### 새 프로젝트 시작하기

\`\`\`bash
/socrates          # 기획 대화 시작
/screen-spec       # 화면 명세 생성
/tasks-generator   # 태스크 생성
/auto-orchestrate  # 자동 개발 시작
\`\`\`

### 기존 프로젝트 분석하기

\`\`\`bash
/reverse           # 스펙 역추출
/sync              # 동기화 상태 검증
\`\`\`

### 코드 품질 검사하기

\`\`\`bash
/trinity           # 五柱 기반 품질 평가
/code-review       # Spec + Code 리뷰
\`\`\`

### 브레인스토밍하기

\`\`\`bash
/neurion           # AI와 아이디어 브레인스토밍
/eureka            # 아이디어 → MVP 변환
\`\`\`
```

### 작성 지침

- 4~5개 시나리오로 분류
- 각 시나리오별 관련 스킬 나열
- 실행 순서대로 표시

---

## 06-requirements.md 템플릿

> **주의: 표(테이블) 형식 사용 금지! 개조식으로 작성**

```markdown
## 필수 요구사항

- [ ] Claude Code CLI 설치
- [ ] Node.js 18 이상
- [ ] Git

## 권장 요구사항

- [ ] gum (TUI 향상) - `brew install gum`
- [ ] 인터넷 연결 (MCP 서버, 리서치)

## 스킬별 추가 요구사항

### /chrome-browser
- Chrome 브라우저
- Puppeteer MCP

### /deep-research
- 인터넷 연결
- 검색 API

### /eureka
- Gemini MCP (ADC 인증)

### Stitch 디자인
- Stitch MCP (API Key)
```

### 작성 지침

- 필수/권장/스킬별로 분류
- 체크리스트 형식
- **테이블 사용 금지** → 스킬별 ### 소제목 + 개조식

---

## 07-mcp-settings.md 템플릿

```markdown
## MCP 서버 설정

### Gemini MCP (ADC 인증)

gcloud CLI를 통한 OAuth 인증이 필요합니다.

1. **gcloud CLI 설치**
   - https://cloud.google.com/sdk/docs/install

2. **ADC 인증**
   \`\`\`bash
   gcloud auth application-default login
   \`\`\`
   브라우저에서 Google 계정으로 로그인

3. **install.sh에서 Gemini MCP 선택**

### Stitch MCP (API Key)

간단한 API Key 방식입니다.

1. **API Key 생성**
   - https://stitch.withgoogle.com/settings
   - "Create Key" 클릭 → Key 복사

2. **install.sh에서 API Key 입력**

### Context7 MCP

자동으로 설치됩니다 (추가 설정 불필요).

\`\`\`json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropic/context7-mcp"]
    }
  }
}
\`\`\`
```

### 작성 지침

- 각 MCP 서버별 단계적 설정 방법
- 필요한 링크 포함
- 설정 예시 JSON 포함

---

## 08-troubleshooting.md 템플릿

```markdown
## 자주 묻는 문제

### Q: 스킬이 인식되지 않아요

**증상:** `/socrates` 등 스킬 명령어가 작동하지 않음

**해결:**
1. 설치 확인: `ls ~/.claude/skills/`
2. Claude Code 재시작
3. `/help`로 스킬 목록 확인
4. 재설치: `./install.sh`

---

### Q: MCP 서버 연결 오류

**증상:** "MCP server not found" 또는 연결 실패

**해결:**
1. 설정 확인: `cat ~/.claude/settings.json`
2. MCP 서버 재설치
3. 인증 상태 확인 (Gemini: `gcloud auth list`)

---

### Q: 권한 오류 (Permission denied)

**증상:** 파일 읽기/쓰기 권한 오류

**해결:**
\`\`\`bash
chmod -R 755 ~/.claude/
\`\`\`

---

### Q: Windows에서 스크립트 실행 안 됨

**증상:** PowerShell 스크립트 실행 정책 오류

**해결:**
\`\`\`powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
\`\`\`
```

### 작성 지침

- Q&A 형식
- 증상 + 해결 구조
- 코드 블록으로 명령어 표시
- 플랫폼별 해결책 분리
