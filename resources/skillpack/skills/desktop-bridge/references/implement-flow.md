# Implement Flow: GitHub Issue → CLI 구현

> GitHub Issue를 기반으로 CLI에서 구현을 시작하는 상세 워크플로우

---

## 이슈 번호 자동 감지

> `/desktop-bridge implement` (번호 없이) 실행 시 자동 감지 로직

### Step 0-1: 상태 파일 확인

```bash
# 상태 파일 존재 확인
if [ -f ".claude/desktop-bridge-state.json" ]; then
  ISSUE_NUM=$(cat .claude/desktop-bridge-state.json | jq -r '.issue_number')
  if [ "$ISSUE_NUM" != "null" ]; then
    # AskUserQuestion: "Issue #{ISSUE_NUM}을 계속 사용할까요?"
  fi
fi
```

### Step 0-2: 최근 이슈 조회

```bash
# from-desktop 라벨이 있는 열린 이슈 조회
gh issue list --label from-desktop --state open --limit 5 --json number,title,createdAt
```

**출력 예시**:
```json
[
  {"number": 123, "title": "[Design] ShopEase - 아키텍처", "createdAt": "2026-01-31T10:00:00Z"},
  {"number": 120, "title": "[Design] Dashboard - 화면 명세", "createdAt": "2026-01-30T14:00:00Z"}
]
```

### Step 0-3: 이슈 선택 질문

```json
{
  "questions": [{
    "question": "구현할 Issue를 선택해주세요:",
    "header": "Issue 선택",
    "options": [
      {"label": "#123: ShopEase - 아키텍처", "description": "2026-01-31 생성"},
      {"label": "#120: Dashboard - 화면 명세", "description": "2026-01-30 생성"},
      {"label": "직접 입력", "description": "다른 이슈 번호 입력"}
    ]
  }]
}
```

### Step 0-4: 이슈 없을 경우

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ 연결된 Issue를 찾을 수 없습니다                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  다음 방법 중 하나를 선택해주세요:                                │
│                                                                 │
│  1. Issue 번호 직접 입력:                                        │
│     /desktop-bridge implement #123                              │
│                                                                 │
│  2. Desktop에서 먼저 설계 발행:                                  │
│     /desktop-bridge publish                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 사전 조건

```
✅ GitHub 연동:
   - gh CLI 설치 및 인증 완료
   - Issue 번호가 유효함

✅ 로컬 환경:
   - git 저장소 초기화됨
   - 작업 디렉토리가 깨끗함 (또는 커밋됨)
```

---

## Phase 1: Issue 내용 로드

### Step 1-1: Issue 조회

```bash
# Issue 전체 정보 조회
gh issue view {N} --json title,body,labels,state,createdAt

# 출력 예시
{
  "title": "[Design] ShopEase - 아키텍처 및 화면 명세",
  "body": "## 📋 설계 요약\n...",
  "labels": ["design", "from-desktop"],
  "state": "OPEN",
  "createdAt": "2026-01-31T10:00:00Z"
}
```

### Step 1-2: 본문 파싱

```typescript
// 정규식으로 섹션 추출
const sections = {
  summary: extractSection(body, "## 📋 설계 요약"),
  features: extractSection(body, "## 🎯 핵심 기능"),
  screens: extractSection(body, "## 📱 화면 목록"),
  techStack: extractSection(body, "## 🔧 기술 스택"),
  prd: extractDetails(body, "PRD"),
  trd: extractDetails(body, "TRD"),
  screenSpecs: extractDetails(body, "화면 명세 상세")
}

// 화면 체크리스트 파싱
// "- [ ] `product-list`: 상품 목록 - /products"
const screenRegex = /- \[( |x)\] `(.+?)`: (.+?) - (.+)/g
const screens = parseCheckboxList(sections.screens)
```

### Step 1-3: 유효성 검증

```typescript
// 필수 섹션 존재 확인
if (!sections.summary) throw "설계 요약 섹션 없음"
if (!sections.screens) throw "화면 목록 섹션 없음"
if (screens.length === 0) throw "화면이 정의되지 않음"

// from-desktop 라벨 확인 (선택)
const isFromDesktop = labels.includes("from-desktop")
if (!isFromDesktop) {
  console.warn("⚠️ 이 Issue는 /desktop-bridge publish로 생성되지 않았습니다")
}
```

---

## Phase 2: 로컬 명세 생성

### Step 2-1: 디렉토리 구조 생성

```bash
mkdir -p specs/screens
mkdir -p specs/domain
mkdir -p docs/planning
```

### Step 2-2: 화면 명세 복원 (없는 경우)

```typescript
// Issue 본문에서 YAML 추출 시
for (screen of extractedYamls) {
  Write(`specs/screens/${screen.id}.yaml`, screen.content)
}

// YAML이 없으면 기본 템플릿 생성
for (screen of screens) {
  if (!exists(`specs/screens/${screen.id}.yaml`)) {
    const template = generateScreenTemplate(screen)
    Write(`specs/screens/${screen.id}.yaml`, template)
  }
}
```

**기본 템플릿**:
```yaml
version: "2.0"
screen:
  name: "{screen_name}"
  route: "{route}"
  layout: main-content
  auth: false

data_requirements:
  - resource: TBD
    needs: [id]

components:
  - id: main_content
    type: container
    description: "{screen_name} 메인 컨텐츠"

tests:
  - name: 페이지 로드
    when: 페이지 접속
    then: [정상 렌더링]

# TODO: Desktop에서 상세 명세 보완 필요
```

### Step 2-3: 기획 문서 복원

```typescript
// PRD 복원
if (sections.prd) {
  Write("docs/planning/01-prd.md", formatPRD(sections.prd))
}

// TRD 복원
if (sections.trd) {
  Write("docs/planning/02-trd.md", formatTRD(sections.trd))
}

// 최소 문서 생성 (없는 경우)
if (!sections.prd) {
  const minimalPRD = generateMinimalPRD(sections)
  Write("docs/planning/01-prd.md", minimalPRD)
}
```

---

## Phase 3: TASKS.md 생성

### Step 3-1: /tasks-generator 연동

```typescript
// 내부적으로 tasks-generator 로직 호출
// 또는 스킬 체인으로 연결

// 화면 목록에서 Task 생성
const phases = {
  0: { name: "프로젝트 셋업", tasks: [] },
  1: { name: "데이터베이스", tasks: [] },
  2: { name: "백엔드 API", tasks: [] },
  3: { name: "프론트엔드 화면", tasks: [] },
  4: { name: "통합 및 테스트", tasks: [] }
}

// 화면별 Task 분배
for (screen of screens) {
  phases[2].tasks.push({
    id: `P2-S${i}-T1`,
    name: `${screen.name} API`,
    담당: "backend-specialist"
  })

  phases[3].tasks.push({
    id: `P3-S${i}-T1`,
    name: `${screen.name} UI`,
    담당: "frontend-specialist"
  })

  phases[3].tasks.push({
    id: `P3-S${i}-V`,
    name: `${screen.name} 연결점 검증`,
    담당: "orchestrator"
  })
}
```

### Step 3-2: TASKS.md 저장

```markdown
# TASKS.md

> Issue #{N} 기반 자동 생성

## Phase 0: 프로젝트 셋업

### P0-T1: 환경 셋업
- [ ] 프로젝트 구조 생성
- [ ] 의존성 설치
- [ ] Docker 환경 구성

## Phase 1: 데이터베이스

### P1-T1: 스키마 설계
- [ ] ERD 작성
- [ ] 마이그레이션 생성

## Phase 2: 백엔드 API

{화면별 API 태스크}

## Phase 3: 프론트엔드 화면

{화면별 UI 태스크}

## Phase 4: 통합 및 테스트

### P4-T1: 통합 테스트
- [ ] E2E 테스트
- [ ] 성능 테스트

---

📋 Source: GitHub Issue #{N}
🔗 {issue_url}
```

### Step 3-3: Issue-Task 매핑 저장

```json
// .claude/desktop-bridge-state.json 업데이트
{
  "issue_number": 123,
  "screen_task_mapping": {
    "product-list": {
      "api_task": "P2-S1-T1",
      "ui_task": "P3-S1-T1",
      "verify_task": "P3-S1-V"
    }
  }
}
```

---

## Phase 4: 구현 준비 완료

### Step 4-1: 사용자에게 결과 표시

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ 구현 준비 완료!                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 Issue #{N} 연동됨                                           │
│  📱 화면: {screen_count}개                                      │
│  📝 TASKS.md 생성됨 ({task_count}개 태스크)                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📁 생성된 파일:                                                │
│     - docs/planning/06-tasks.md                                │
│     - specs/screens/*.yaml ({screen_count}개)                  │
│     - .claude/desktop-bridge-state.json                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4-2: 다음 단계 안내

```json
{
  "questions": [{
    "question": "구현 준비가 완료되었습니다! 다음 단계를 선택해주세요:",
    "header": "다음 단계",
    "options": [
      {"label": "/project-bootstrap 실행", "description": "에이전트 팀 + 환경 셋업 (권장)"},
      {"label": "/auto-orchestrate 실행", "description": "바로 완전 자동화 개발 시작"}
    ]
  }]
}
```

---

## 진행 상황 동기화

### Phase 완료 시 Issue 코멘트

```bash
# Phase 완료 코멘트
gh issue comment {N} --body "$(cat <<'EOF'
## ✅ Phase {phase_num} 완료

**{phase_name}**

### 완료된 Task
- [x] {task_1}
- [x] {task_2}

### 다음 Phase
- Phase {next_phase_num}: {next_phase_name}

---
🤖 Auto-updated by Claude Code CLI
📅 {timestamp}
EOF
)"
```

### 화면 체크박스 업데이트

```typescript
// Issue 본문 가져오기
const issue = await gh.issue.get(N)

// 체크박스 업데이트
const updatedBody = issue.body.replace(
  `- [ ] \`${screen_id}\`:`,
  `- [x] \`${screen_id}\`:`
)

// Issue 업데이트
await gh.issue.edit(N, { body: updatedBody })
```

### 전체 완료 시 Issue 닫기

```bash
# 완료 코멘트 추가
gh issue comment {N} --body "$(cat <<'EOF'
## 🎉 구현 완료!

### 요약
- 총 화면: {screen_count}개
- 총 Task: {task_count}개
- 소요 시간: {duration}

### 산출물
- PR: #{pr_number}
- 브랜치: feature/{branch_name}

---
🤖 Closed by Claude Code CLI
📅 {timestamp}
EOF
)"

# Issue 닫기
gh issue close {N} --reason completed
```

---

## 에러 처리

### Issue 없음

```
❌ Issue #{N}을 찾을 수 없습니다.

$ gh issue view {N}
→ 오류 확인

💡 Issue 번호를 확인해주세요.
```

### Issue 형식 불일치

```
⚠️ 이 Issue는 표준 형식이 아닙니다.

기대 섹션:
- 📋 설계 요약
- 📱 화면 목록

💡 /desktop-bridge publish로 생성된 Issue를 사용해주세요.
```

### 이미 닫힌 Issue

```
⚠️ Issue #{N}은 이미 닫혀있습니다.

다시 열려면:
$ gh issue reopen {N}
```

---

## 고급 옵션

### --no-tasks 옵션

```bash
/desktop-bridge implement #123 --no-tasks
```

- TASKS.md 생성 건너뛰기
- 수동으로 태스크 작성 원할 때

### --force 옵션

```bash
/desktop-bridge implement #123 --force
```

- 기존 로컬 파일 덮어쓰기
- 충돌 무시하고 Issue 내용으로 복원

### --resume 옵션

```bash
/desktop-bridge implement #123 --resume
```

- 중단된 구현 재개
- .claude/desktop-bridge-state.json 참조
