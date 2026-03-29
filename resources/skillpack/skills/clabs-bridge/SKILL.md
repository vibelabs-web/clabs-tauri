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

## 실행 방법

`/bridge` 명령을 받으면 **즉시 Bash로 clabs CLI를 실행**하라:

```bash
# /bridge t2 리뷰해줘 → 이렇게 실행:
clabs pane send "t2" "리뷰해줘"

# /bridge list → 이렇게 실행:
clabs pane list

# /bridge read t2 → 이렇게 실행:
clabs pane read "t2" --lines 30

# /bridge keys t2 Enter → 이렇게 실행:
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

## 제약 조건

- Clabs 앱이 실행 중이어야 함 (`~/.clabs/sock` 소켓 존재)
- 대상 페인에 PTY가 실행 중이어야 함
- 긴 텍스트(1000자+) 전송 시 `type` + `keys Enter` 분리 권장
