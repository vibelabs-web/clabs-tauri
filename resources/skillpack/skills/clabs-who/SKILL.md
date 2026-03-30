---
name: who
description: 실행 중인 Clabs 인스턴스 목록 조회. 현재 인스턴스 표시.
trigger: "/who", "인스턴스 목록", "누가 실행 중"
---

# /who — 실행 중인 Clabs 인스턴스 목록

> 현재 실행 중인 모든 Clabs 앱을 보여주고, 내가 어느 인스턴스인지 표시한다.

## 실행 방법

`/who` 명령을 받으면 즉시 아래 Bash를 실행하라:

```bash
# 1. 인스턴스 목록 조회
INSTANCES=$(clabs instances)

# 2. 현재 내 PID 확인
MY_PID=$(echo "$INSTANCES" | python3 -c "
import sys, json, os
instances = json.load(sys.stdin)
my_socket = os.environ.get('CLABS_SOCKET', '')
for pid, info in instances.items():
    marker = ' ← ME' if info.get('socket','') == my_socket else ''
    name = info.get('name', '') or '(unnamed)'
    print(f\"  [{pid}] {name}{marker}\")
")

echo "$MY_PID"
```

## 출력 예시

```
  [14373] clabs-tauri ← ME
  [21505] bullet-journal
  [32100] clabs-tauri
```

`← ME`가 표시된 것이 현재 내가 실행 중인 인스턴스다.

## 다른 인스턴스에 메시지 보내기

```bash
# PID 또는 프로젝트명으로 전송
clabs send-to 21505 "Terminal" "빌드해줘"
clabs send-to bullet-journal "Terminal" "빌드해줘"
```
