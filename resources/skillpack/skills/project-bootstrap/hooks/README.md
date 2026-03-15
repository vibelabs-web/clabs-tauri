# Hook System

Claude Code 이벤트에 자동으로 반응하는 훅 시스템입니다.

## 설치

### 1. 훅 파일 복사

```bash
# 훅 디렉토리 생성
mkdir -p ~/.claude/hooks

# 파일 복사
cp ~/.claude/skills/project-bootstrap/hooks/*.sh ~/.claude/hooks/
cp ~/.claude/skills/project-bootstrap/hooks/*.py ~/.claude/hooks/

# 실행 권한 부여
chmod +x ~/.claude/hooks/*.sh
chmod +x ~/.claude/hooks/*.py
```

### 2. settings.json 설정

`~/.claude/settings.json`에 다음을 추가:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "python3 ~/.claude/hooks/session_init.py"
      }
    ],
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "bash ~/.claude/hooks/skill_evaluator_hook.sh"
      }
    ],
    "PreToolUse": [
      {
        "type": "command",
        "command": "bash ~/.claude/hooks/defense_in_depth_hook.sh",
        "matcher": "Bash"
      }
    ]
  }
}
```

## 훅 종류

### SessionStart

세션 시작 시 실행됩니다.

**`session_init.py`**:
- 프로젝트 컨텍스트 로드
- CLAUDE.md 감지
- 에이전트 팀 확인
- 기술 스택 감지

**출력 예시:**
```
✅ Session initialized: my-project
   Agents: orchestrator, backend-specialist, frontend-specialist
   Tech: nodejs, docker
   📄 CLAUDE.md loaded
```

### UserPromptSubmit

사용자가 프롬프트를 제출할 때 실행됩니다.

**`skill_evaluator_hook.sh`**:
- 프롬프트 분석
- 관련 스킬 매칭
- 추천 표시

**출력 예시:**
```
⚡ 매칭된 스킬: project-bootstrap, socrates
```

### PreToolUse

도구 실행 전에 실행됩니다.

**`defense_in_depth_hook.sh`** (Bash 도구용):
- 위험 명령 감지
- 자동 백업 생성
- CRITICAL 명령 확인 요청

**출력 예시:**
```
🛡️ DANGEROUS 명령 감지: 자동 백업 생성
  ├── ✅ Backup commit created
  └── ✅ Safe to proceed
```

## 훅 작성 가이드

### 기본 구조

```bash
#!/bin/bash
# Hook Name
# 설명

# stdin에서 입력 읽기
INPUT=$(cat)

# 처리
# ...

# 종료 코드
# 0 = 성공, 계속 진행
# 1 = 실패, 작업 중단 (PreToolUse에서만)
exit 0
```

### Python 훅

```python
#!/usr/bin/env python3
"""Hook Name"""

import sys
import json

def main():
    # stdin에서 입력 읽기
    input_data = sys.stdin.read()

    # 처리
    # ...

    # 출력 (사용자에게 표시됨)
    print("✅ Hook executed")

if __name__ == "__main__":
    main()
```

## 이벤트별 입력 형식

| 이벤트 | 입력 형식 |
|--------|----------|
| SessionStart | 없음 |
| UserPromptSubmit | 사용자 프롬프트 (텍스트) |
| PreToolUse | 도구 입력 (JSON) |
| PostToolUse | 도구 출력 (JSON) |
| Stop | 없음 |

### PreToolUse JSON 예시

```json
{
  "tool": "Bash",
  "command": "rm -rf build/"
}
```

## 디버깅

훅 실행 로그 확인:

```bash
# 임시 로그 파일
tail -f /tmp/claude-hooks.log

# 훅에서 로그 작성
echo "$(date): Hook executed" >> /tmp/claude-hooks.log
```

## 주의사항

1. **실행 권한**: 훅 파일에 실행 권한 필수 (`chmod +x`)
2. **경로**: 절대 경로 사용 권장
3. **타임아웃**: 훅은 빠르게 실행되어야 함 (권장: 1초 이내)
4. **출력**: stdout은 사용자에게 표시됨
5. **종료 코드**: PreToolUse에서 exit 1은 작업을 중단함
