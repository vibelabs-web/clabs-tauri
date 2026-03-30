---
name: cmux
description: cmux surface에 메시지 전송. Clabs → cmux 단방향 통신.
trigger: "/cmux", "cmux에 보내", "cmux로 전송"
---

# /cmux — cmux surface에 메시지 보내기

> `/cmux my-surface 리뷰해줘`
> Clabs에서 cmux 터미널로 메시지를 전송한다.

## 사용법

```
/cmux <surface> <message>     — cmux surface에 메시지 전송
/cmux list                    — (cmux CLI로 surface 목록 확인)
```

## 실행 방법

`/cmux` 명령을 받으면 즉시 Bash로 실행하라:

```bash
# /cmux my-surface 리뷰해줘
clabs cmux "my-surface" "리뷰해줘"

# 또는 cmux CLI 직접 사용
cmux send "my-surface" "리뷰해줘"
```

## 참고

- **단방향**: Clabs → cmux 전송만 가능 (cmux → Clabs는 cmux 쪽에서 구현 필요)
- cmux가 설치되어 있어야 함 (`brew install cmux` 또는 cmux.com)
- surface 이름은 cmux 앱에서 확인
