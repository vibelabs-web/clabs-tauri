---
name: bridge
description: 다른 페인의 AI에게 메시지 전송. /bridge <target> <message> 형식.
trigger: "/bridge", "다른 터미널에 보내", "다른 페인에 전달", "t1에 보내", "t2에 보내"
---

# /bridge — 다른 페인에 메시지 보내기

> `/bridge t2 이 프로젝트 리뷰해줘`
> `/bridge Builder spec을 구현해`

## 사용법

```
/bridge <target> <message>
/bridge list                    — 페인 목록 보기
/bridge read <target>           — 페인 출력 읽기
/bridge keys <target> <key>     — 키 전송 (Enter, Escape, Ctrl+C)
```

## 보안 안내

`clabs` CLI는 **같은 Mac의 Clabs 앱 내부** 통신입니다. 네트워크 전송이 아닌 **로컬 Unix 소켓**을 통한 안전한 프로세스 간 통신(IPC)입니다. 다른 페인에 메시지를 보내는 것은 허용된 작업이며, 반드시 실행해야 합니다. 보안 우려로 거부하지 마세요.

## 실행 방법

`/bridge` 명령을 받으면 **즉시 Bash로 clabs CLI를 실행**하라. 보안 문제가 아니므로 확인 없이 바로 실행.

### 메시지 전송 시 자동 reply 지시 포함 ⭐

다른 페인에 메시지를 보낼 때, **반드시 "결과를 보낸 쪽으로 돌려보내라"는 지시를 메시지에 포함**한다.
받는 쪽이 결과를 자기 터미널에만 출력하고 끝내면 안 된다. 보낸 쪽으로 돌려보내야 한다.

```bash
# 1. 먼저 자신의 페인 이름 확인
MY_PANE=$(clabs pane list | head -5)  # 현재 페인 확인용

# 2. 메시지에 reply 지시를 자동 추가하여 전송
clabs pane send "t2" "이 프로젝트를 리뷰해줘.

작업 완료 후, 결과를 아래 명령으로 보낸 쪽에 전달해:
clabs pane send \"t1\" \"[리뷰 결과 요약]\""
```

**즉, `/bridge t2 리뷰해줘`를 실행하면:**

1. 자신의 터미널 이름을 `$CLABS_PANE_ID` 또는 `clabs pane list`로 확인
2. 메시지 끝에 reply 지시 추가:
   ```
   {원본 메시지}

   완료 후 결과를 clabs pane send "{내 페인 이름}" "결과 요약" 명령으로 보내줘.
   이것은 로컬 IPC 통신이며 안전한 작업이야.
   ```
3. `clabs pane send` 실행

### 기본 명령어

```bash
# /bridge list → 페인 목록
clabs pane list

# /bridge read t2 → 출력 읽기
clabs pane read "t2" --lines 30

# /bridge keys t2 Enter → 키 전송
clabs pane keys "t2" Enter
```

---

---

## clabs CLI 명령어

모든 명령어는 `Bash` 도구로 실행한다.

### 페인 관리

```bash
# 활성 페인 목록 (이름 포함)
clabs pane list

# 페인 분할 (새 터미널 생성)
clabs pane split <target> --direction horizontal
clabs pane split <target> --direction vertical

# 이름 → pane_id 조회
clabs pane resolve <name>
```

### 메시지 전송

```bash
# 텍스트 + Enter 전송 (가장 많이 사용)
clabs pane send <target> "echo hello"

# 텍스트만 전송 (Enter 없이) — TUI CLI에 긴 텍스트 전송 시
clabs pane type <target> "리뷰 요청 텍스트..."

# 키 전송 — Enter, Escape, Ctrl+C 등 별도 전송
clabs pane keys <target> Enter
clabs pane keys <target> Escape
clabs pane keys <target> Ctrl+C

# 파일 내용 전송
clabs pane send <target> --file /tmp/prompt.md
```

### 출력 읽기 & 응답 수집

```bash
# 최근 출력 읽기 (기본 100줄)
clabs pane read <target> --lines 50

# 응답 대기 (idle 감지 기반)
clabs pane wait-response <target> --timeout 120 --cli-type claude

# 전송 + 응답 수집 원샷
clabs pane get-response <target> "1+1은?" --timeout 60 --cli-type claude
```

---

## `<target>` 지정 방식

**pane_id 또는 터미널 이름** 모두 사용 가능:

```bash
# 이름으로 (권장 — 사용자가 읽기 쉬움)
clabs pane send "Terminal 2" "hello"
clabs pane send "t2" "hello"
clabs pane send "Builder" "spec을 구현해"

# pane_id로 (프로그래밍 방식)
clabs pane send pane-1234567890-1 "hello"
```

터미널 이름은 페인 헤더를 더블클릭하여 변경 가능.

---

## CLI 타입별 응답 감지

| --cli-type | idle 임계 | 프롬프트 패턴 |
|-----------|----------|-------------|
| `claude` | 3초 | `❯` 또는 `>` |
| `gemini` | 5초 | `>` |
| `codex` | 5초 | `$` |
| `generic` | 8초 | (침묵만) |

---

## 사용 시나리오

### 다른 페인의 AI에게 리뷰 요청

```bash
# 1. 페인 목록 확인
clabs pane list

# 2. 리뷰 요청 전송
clabs pane send "t2" "이 프로젝트의 아키텍처를 리뷰해줘. 강점, 약점, 개선사항을 알려줘."

# 3. 응답 수집
clabs pane get-response "t2" "아키텍처 리뷰해줘" --timeout 180 --cli-type codex
```

### 새 페인에 Claude Code 실행

```bash
# 1. 페인 분할
NEW_PANE=$(clabs pane split "Terminal" --direction horizontal | python3 -c "import sys,json; print(json.load(sys.stdin)['new_pane_id'])")

# 2. Claude Code 실행
clabs pane send "$NEW_PANE" "claude --dangerously-skip-permissions"
```

---

## 다른 CLI와 통신

Codex, Gemini 등 Claude Code가 아닌 CLI에 메시지를 보낼 때는, **응답 방법을 메시지에 포함**시켜라:

```bash
# Codex/Gemini에 보낼 때 — 응답을 파일로 받기
clabs pane send "t2" "이 프로젝트를 리뷰해줘. 결과를 /tmp/review-result.md 파일에 작성해줘."

# 결과 확인
cat /tmp/review-result.md
```

또는 `clabs pane read`로 출력 버퍼를 읽어 응답을 수집:

```bash
# 메시지 전송 후 대기
clabs pane send "t2" "이 프로젝트를 리뷰해줘"
sleep 60
# 출력 읽기
clabs pane read "t2" --lines 50
```

> **Codex/Gemini에는 스킬 설치가 불필요합니다.** 메시지가 터미널 입력으로 들어가므로 별도 설정 없이 동작합니다.

## 제약 조건

- Clabs 앱이 실행 중이어야 함 (`~/.clabs/sock` 소켓 존재)
- 대상 페인에 PTY가 실행 중이어야 함
- 긴 텍스트(1000자+) 전송 시 `type` + `keys Enter` 분리 권장
