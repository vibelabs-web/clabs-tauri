---
name: chrome-browser
description: Claude Code의 Chrome 브라우저 제어 기능. 로컬 웹앱 테스트, UI 디버깅, 폼 자동화, 멀티 사이트 워크플로우를 위한 브라우저 자동화.
---

# ⛔ 절대 금지 사항 (CRITICAL!)

**이 스킬이 발동되면 절대로 다음 행동을 하지 마세요:**

1. ❌ **환경 체크 없이 바로 브라우저 작업 시작하지 마세요**
2. ❌ **Chrome 연결 상태 확인 없이 브라우저 도구 사용하지 마세요**
3. ❌ **사용자에게 무엇을 할지 묻지 않고 임의로 작업하지 마세요**

---

# ✅ 스킬 발동 시 즉시 실행할 행동

**이 스킬이 발동되면 즉시 다음 순서로 실행하세요:**

```
1. 환경 체크 실행 (Claude Code 버전 확인)
2. Claude in Chrome 확장 연결 상태 확인
3. 연결 안 됨 → 연결 방법 안내 후 AskUserQuestion으로 확인
4. 연결됨 → AskUserQuestion으로 작업 선택
5. 선택된 작업 수행
```

---

# Claude in Chrome 확장 프로그램

> **중요**: 이 스킬은 **Claude in Chrome 확장 프로그램** 전용입니다.
> Playwright MCP와는 다른 별도의 기능입니다.

## Claude in Chrome이란?

Claude in Chrome은 Chrome 웹 스토어에서 설치하는 **공식 확장 프로그램**입니다.
Claude Code와 Chrome 브라우저를 연결하여 웹페이지를 직접 제어할 수 있게 해줍니다.

---

# 🔧 환경 체크 (Step 1)

**스킬 시작 전 환경을 확인합니다.**

## 필수 요구사항

| 요구사항 | 최소 버전 | 확인 방법 |
|---------|----------|----------|
| Claude Code CLI | v2.0.73+ | `claude --version` |
| Chrome 브라우저 | 최신 권장 | 설치 여부 확인 |
| Claude in Chrome 확장 | v1.0.36+ | Chrome 확장 프로그램 관리 페이지 |

## 환경 체크 명령어

```bash
# Claude Code 버전 확인 (필수)
claude --version
```

## 환경 체크 결과 안내 형식

```
⚠️ 환경 체크 결과

[필수] Claude Code: {버전} - {v2.0.73 이상이면 ✅, 미만이면 ❌}

---

Claude Code 업데이트 방법:
- npm: `npm update -g @anthropic-ai/claude-code`
- brew: `brew upgrade claude-code`

Chrome 확장 프로그램 설치:
1. Chrome 웹 스토어에서 "Claude in Chrome" 검색
2. 확장 프로그램 설치 (v1.0.36 이상)
3. 확장 프로그램 아이콘 클릭 → Claude 계정 로그인
```

---

# 🔗 Claude in Chrome 연결 확인 (Step 2)

## 연결 상태 확인 방법

**사용자에게 현재 세션 시작 방법을 확인합니다:**

지금 즉시 AskUserQuestion 도구를 호출하여 다음을 질문하세요:

- question: "현재 Claude Code를 어떻게 시작하셨나요?"
- header: "세션 확인"
- options:
  1. "claude --chrome 으로 시작함" - "Chrome 연결 모드로 시작됨"
  2. "일반 claude 로 시작함" - "Chrome 연결 없이 시작됨"
  3. "모르겠음" - "확인 방법 안내 필요"

### 응답별 처리

| 응답 | 상태 | 다음 단계 |
|------|------|----------|
| `claude --chrome`으로 시작 | ✅ 연결됨 | Step 4로 이동 |
| 일반 `claude`로 시작 | ❌ 연결 안 됨 | Step 3으로 이동 |
| 모르겠음 | ❓ 확인 필요 | Step 3으로 이동 |

---

# 📡 연결 안내 (Step 3)

**Chrome이 연결되지 않은 경우 안내합니다:**

```
Chrome 브라우저가 연결되어 있지 않습니다.

📋 연결 방법:

1️⃣ 현재 Claude Code 세션을 종료하세요
   → Ctrl+C 또는 /exit

2️⃣ Chrome 브라우저를 실행하세요

3️⃣ Claude in Chrome 확장 프로그램 확인
   → Chrome 웹 스토어에서 "Claude in Chrome" 검색 후 설치
   → 확장 프로그램 아이콘 클릭 → Claude 계정 로그인

4️⃣ Chrome 연결 모드로 Claude Code 시작
   → claude --chrome

5️⃣ 다시 /chrome-browser 실행
```

**AskUserQuestion으로 확인:**

지금 즉시 AskUserQuestion 도구를 호출하세요:

- question: "Chrome 연결 준비가 되셨나요?"
- header: "Chrome 연결"
- options:
  1. "준비 완료" - "Chrome과 확장 프로그램이 준비됨"
  2. "도움 필요" - "설치 방법 자세히 안내"

---

# 🎯 작업 선택 (Step 4)

**Chrome이 연결된 경우 AskUserQuestion으로 작업을 선택합니다:**

지금 즉시 AskUserQuestion 도구를 호출하세요:

- question: "어떤 작업을 수행할까요?"
- header: "작업 선택"
- options:
  1. "로컬 앱 테스트" - "localhost 웹앱 테스트 및 디버깅"
  2. "페이지 분석" - "현재 페이지 구조, 콘솔, 네트워크 분석"
  3. "폼 자동화" - "폼 필드 자동 입력 및 제출"
  4. "스크린샷" - "화면 캡처"

---

# 🛠️ 작업별 실행 (Step 5)

## 로컬 앱 테스트

```
1. 사용자에게 테스트할 URL 질문 (예: localhost:3000)
2. Chrome에서 해당 URL 열기 안내
3. 페이지 로드 확인 후 테스트 시나리오 질문
4. 대화를 통해 테스트 시나리오 수행
   - "로그인 버튼 클릭해줘"
   - "이메일 필드에 test@example.com 입력해줘"
   - "폼 제출해줘"
```

## 페이지 분석

```
1. 현재 페이지 구조 분석 요청
2. 콘솔 로그 확인 요청
3. 네트워크 요청 확인 요청
4. 분석 결과를 사용자에게 보고
```

## 폼 자동화

```
1. 현재 페이지의 폼 필드 확인
2. 사용자에게 입력할 데이터 질문
3. 폼 필드에 데이터 입력
4. 결과 확인 및 보고
```

## 스크린샷

```
1. 현재 페이지 스크린샷 캡처
2. 파일 경로를 사용자에게 안내
```

---

# Chrome Browser Control

Claude Code와 Chrome 확장 프로그램을 연결하여 브라우저를 직접 제어합니다.

---

## 주요 기능

### 1. 페이지 탐색

```
# 특정 URL로 이동
"localhost:3000으로 이동해줘"

# 새 탭 열기
"새 탭에서 github.com 열어줘"
```

### 2. 요소 상호작용

```
# 버튼 클릭
"Submit 버튼 클릭해줘"

# 텍스트 입력
"이메일 필드에 test@example.com 입력해줘"

# 폼 제출
"로그인 폼 제출해줘"
```

### 3. 페이지 분석

```
# 콘솔 로그 확인
"콘솔 에러 있어?"

# 네트워크 요청 확인
"실패한 API 요청 보여줘"

# 페이지 구조 분석
"현재 페이지의 주요 요소들 설명해줘"
```

### 4. 스크린샷

```
# 스크린샷 캡처
"현재 화면 스크린샷 찍어줘"
```

---

## 권한 시스템

### 기본 권한 (자동 승인)

| 작업 | 설명 |
|------|------|
| 스크린샷 캡처 | 현재 탭 스크린샷 |
| 페이지 읽기 | DOM 구조, 텍스트 |
| 콘솔 로그 | console.log 출력 |
| 네트워크 요청 | API 요청/응답 |

### 승인 필요 권한

| 작업 | 설명 |
|------|------|
| 클릭 | 버튼, 링크 클릭 |
| 타이핑 | 폼 필드 입력 |
| 페이지 이동 | URL 변경 |
| 파일 업로드 | 파일 선택 다이얼로그 |

---

## 사용 사례

### 1. 로컬 웹앱 테스트

```
# 개발 서버 시작 후 테스트
1. "localhost:3000으로 이동해줘"
2. "회원가입 버튼 클릭해줘"
3. "이름 필드에 '테스트 유저' 입력해줘"
4. "폼 제출하고 결과 확인해줘"
```

### 2. UI 디버깅

```
# 콘솔 에러 디버깅
1. "콘솔에 에러 있어?"
2. "네트워크 탭에서 실패한 요청 보여줘"
3. "에러 원인 분석해줘"
```

### 3. 폼 자동화

```
# 복잡한 폼 자동 입력
"회원가입 폼에 다음 정보 입력해줘:
- 이름: 홍길동
- 이메일: hong@example.com
- 비밀번호: secure123"
```

### 4. E2E 테스트

```
# 사용자 시나리오 테스트
1. "로그인 페이지로 이동해줘"
2. "admin@test.com으로 로그인해줘"
3. "대시보드가 제대로 로드되는지 확인해줘"
4. "모든 차트가 데이터를 표시하는지 확인해줘"
```

---

## 📺 데모 페이지 스크린샷 검증

**auto-orchestrate와 연동하여 프론트엔드 태스크를 검증합니다.**

### 검증 워크플로우

```
1. 페이지 접근
   └── localhost:3000/demo/phase-N/task-id

2. 상태 전환
   └── 각 상태 버튼 클릭 (loading, error, empty, normal)

3. 스크린샷
   └── 각 상태별 캡처

4. 콘솔 확인
   └── 에러 메시지 검출

5. 결과 판정
   └── 모든 상태 정상 = 통과
```

### 검증 기준

| 항목 | 기준 | 판정 |
|------|------|------|
| 렌더링 | 컴포넌트가 보임 | 필수 |
| 레이아웃 | 요소 겹침 없음 | 필수 |
| 콘솔 | 에러 없음 (warning은 허용) | 필수 |
| 텍스트 | 잘림 없음 | 권장 |

### MCP 도구 호출 순서

```
# 1. 페이지 이동
mcp__claude-in-chrome__navigate({
  url: "http://localhost:3000/demo/phase-2/t2-3-transaction-form",
  tabId: {현재_탭_ID}
})

# 2. 상태 버튼 찾기
mcp__claude-in-chrome__find({
  query: "loading 버튼",
  tabId: {현재_탭_ID}
})

# 3. 버튼 클릭
mcp__claude-in-chrome__computer({
  action: "left_click",
  ref: "ref_1",
  tabId: {현재_탭_ID}
})

# 4. 대기 후 스크린샷
mcp__claude-in-chrome__computer({
  action: "wait",
  duration: 2,
  tabId: {현재_탭_ID}
})

mcp__claude-in-chrome__computer({
  action: "screenshot",
  tabId: {현재_탭_ID}
})

# 5. 콘솔 에러 확인
mcp__claude-in-chrome__read_console_messages({
  tabId: {현재_탭_ID},
  onlyErrors: true
})
```

### 실패 시 행동

```
스크린샷 검증 실패
    ↓
1. 에러 유형 분석
   ├── 렌더링 실패 → 컴포넌트 로직 확인
   ├── 레이아웃 문제 → CSS 수정
   └── 콘솔 에러 → 코드 수정

2. frontend-specialist에게 수정 요청
   └── "TransactionForm.tsx:45에서 overflow 문제 발견"

3. 수정 후 재검증
   └── 동일 워크플로우 반복
```

---

## 제한사항

### 기술적 제한

| 제한 | 설명 |
|------|------|
| Chrome 전용 | Firefox, Safari 미지원 |
| 확장 필수 | Claude in Chrome 확장 프로그램 필수 |
| --chrome 플래그 필수 | `claude --chrome`으로 시작해야 함 |
| 단일 브라우저 | 한 번에 하나의 Chrome 인스턴스 |

### 보안 제한

| 제한 | 설명 |
|------|------|
| 민감한 페이지 | 은행, 결제 페이지 접근 제한 |
| 비밀번호 관리자 | 브라우저 비밀번호 접근 불가 |
| 확장 프로그램 페이지 | chrome:// 페이지 접근 불가 |

---

## 트러블슈팅

### 연결 실패

```
❌ "Chrome 확장 프로그램에 연결할 수 없습니다"

해결책:
1. Claude in Chrome 확장 프로그램 설치 확인
2. 확장 프로그램 버전 v1.0.36+ 확인
3. 확장 프로그램에서 Claude 계정 로그인 확인
4. Chrome 재시작 후 다시 시도
5. `claude --chrome` 으로 새 세션 시작
```

### --chrome 플래그 없이 시작한 경우

```
❌ "브라우저 제어 기능을 사용할 수 없습니다"

해결책:
1. 현재 세션 종료 (Ctrl+C 또는 /exit)
2. `claude --chrome` 명령어로 다시 시작
```

### 권한 거부

```
❌ "이 작업에 대한 권한이 없습니다"

해결책:
1. 프롬프트에서 권한 승인
2. 설정에서 도메인 자동 승인 추가
3. 민감한 페이지인지 확인
```

### 요소를 찾을 수 없음

```
❌ "버튼을 찾을 수 없습니다"

해결책:
1. 페이지 로딩 완료 대기
2. 더 구체적인 요소 설명 제공
3. "현재 페이지 요소들 보여줘"로 확인
```

---

## 시작 명령어

### macOS

```bash
# Claude Code + Chrome 연결 모드 시작
claude --chrome
```

### Windows

```powershell
# Claude Code + Chrome 연결 모드 시작
claude --chrome
```

### Linux

```bash
# Claude Code + Chrome 연결 모드 시작
claude --chrome
```

---

## Playwright MCP와의 차이

| 항목 | Claude in Chrome | Playwright MCP |
|------|------------------|----------------|
| 설치 | Chrome 확장 프로그램 | MCP 서버 설정 |
| 시작 방법 | `claude --chrome` | MCP 설정 후 일반 `claude` |
| 브라우저 | 사용자의 Chrome | Playwright가 제어하는 브라우저 |
| 로그인 상태 | 기존 로그인 유지 | 새 세션 (로그인 필요) |
| 확장 프로그램 | 기존 확장 사용 가능 | 확장 없음 |
| 속도 | 빠름 | 상대적으로 느림 |

**이 스킬은 Claude in Chrome 전용입니다.**
Playwright MCP를 사용하려면 별도로 MCP 서버를 설정해야 합니다.

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-20 | **DDD 통합** - 데모 페이지 스크린샷 검증 프로토콜 추가 |
| 2026-01-14 | Claude in Chrome 전용으로 변경 - Playwright MCP 참조 제거 |
| 2026-01-12 | 실행 스킬로 변경 - 환경 체크 및 자동 연결 워크플로우 추가 |
| 2026-01-12 | 초기 버전 - Chrome 브라우저 제어 스킬 분리 |
