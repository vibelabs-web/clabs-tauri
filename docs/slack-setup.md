# Slack 원격 제어 설정 가이드

Clabs 앱을 Slack과 연결하면, 외출 중에도 Slack에서 Claude Code에게 작업을 지시하고 결과를 받을 수 있습니다.

## 구조

```
사용자 (Slack)              사무실 Mac (Clabs 앱)
     │                           │
  @Clabs 할일앱 만들어줘          │
     │                           │
     ▼                           ▼
  Slack API ──WebSocket──→ SlackBridge
                                 │
                          clabs pane send
                                 │
                                 ▼
                           Claude Code
                                 │
                           결과 수집
                                 │
                                 ▼
                          Slack Web API
     │                           │
     ▼                           │
  #ai-agent 채널에 응답 표시
```

---

## 1단계: Slack App 생성

1. https://api.slack.com/apps 접속
2. **Create New App** → **From scratch** 선택
3. App Name: `Clabs`
4. Workspace: 사용할 워크스페이스 선택
5. **Create App** 클릭

## 2단계: Socket Mode 활성화

1. 좌측 메뉴 → **Socket Mode**
2. **Enable Socket Mode** 토글 켜기
3. Token Name: `clabs-socket`
4. **Generate** 클릭
5. 생성된 **App Token** (`xapp-...`) 복사 → 메모장에 저장

## 3단계: Event Subscriptions 설정

1. 좌측 메뉴 → **Event Subscriptions**
2. **Enable Events** 토글 켜기
3. **Subscribe to bot events** 섹션 펼치기
4. **Add Bot User Event** 클릭 → 아래 2개 추가:
   - `message.channels` — 채널 메시지 수신
   - `app_mention` — @멘션 수신
5. **Save Changes** 클릭

## 4단계: OAuth & Permissions 설정

1. 좌측 메뉴 → **OAuth & Permissions**
2. **Bot Token Scopes** 섹션에서 아래 4개 추가:
   - `chat:write` — 메시지 전송
   - `channels:history` — 채널 메시지 읽기
   - `channels:read` — 채널 목록 읽기
   - `app_mentions:read` — 멘션 이벤트 읽기
3. 페이지 상단 **Install to Workspace** 클릭
4. **Allow** 클릭
5. 생성된 **Bot User OAuth Token** (`xoxb-...`) 복사 → 메모장에 저장

## 5단계: Bot User ID 확인

1. 터미널에서 실행:
   ```bash
   curl -s -H "Authorization: Bearer xoxb-YOUR-BOT-TOKEN" \
     https://slack.com/api/auth.test | python3 -m json.tool
   ```
2. 응답의 `user_id` 값 (`U...`) 복사

## 6단계: Clabs 앱에 토큰 등록

터미널에서 아래 명령 실행 (토큰을 실제 값으로 교체):

```bash
python3 -c "
import json, os
path = os.path.expanduser('~/.claude/settings.json')
settings = {}
if os.path.exists(path):
    with open(path) as f:
        settings = json.load(f)
settings['slack_app_token'] = 'xapp-YOUR-APP-TOKEN'
settings['slack_bot_token'] = 'xoxb-YOUR-BOT-TOKEN'
settings['slack_bot_user_id'] = 'U-YOUR-BOT-USER-ID'
with open(path, 'w') as f:
    json.dump(settings, f, indent=2)
print('Slack tokens saved!')
"
```

## 7단계: Slack 채널에 봇 초대

Slack에서 사용할 채널 (예: `#general` 또는 새로 만든 `#ai-agent`)에서:

```
/invite @Clabs
```

## 8단계: Clabs 앱 재시작

Clabs 앱을 종료하고 다시 실행하면 **자동으로 Slack에 연결**됩니다.

## 9단계: 테스트

Slack 채널에서:

```
@Clabs 현재 프로젝트 상태를 알려줘
```

Clabs가 Claude Code에 전달하고, 결과를 채널에 응답합니다.

---

## 사용 예시

```
사용자: @Clabs 할일 앱 만들어줘
Clabs: ⏳ 처리 중...
Clabs: ✅ 완료!
       ```
       프로젝트 생성 완료. 18개 파일 생성.
       http://localhost:5173 에서 확인하세요.
       ```

사용자: @Clabs 로그인 기능 추가해줘
Clabs: ⏳ 처리 중...
Clabs: ✅ 완료!
       ```
       로그인/회원가입 페이지 추가.
       JWT 인증 구현 완료.
       ```
```

---

## 주의사항

- Clabs 앱이 **실행 중**이어야 합니다 (Mac이 켜져 있고 앱이 열려 있어야 함)
- 터미널에 **Claude Code가 실행 중**이어야 합니다
- 토큰은 `~/.claude/settings.json`에 저장됩니다 (git에 포함되지 않음)
- 봇은 **@멘션**된 메시지만 처리합니다 (채널의 모든 메시지를 읽지 않음)

---

## 토큰 제거 (연결 해제)

```bash
python3 -c "
import json, os
path = os.path.expanduser('~/.claude/settings.json')
with open(path) as f:
    settings = json.load(f)
for key in ['slack_app_token', 'slack_bot_token', 'slack_bot_user_id']:
    settings.pop(key, None)
with open(path, 'w') as f:
    json.dump(settings, f, indent=2)
print('Slack tokens removed!')
"
```

앱 재시작 후 Slack 연결이 해제됩니다.
