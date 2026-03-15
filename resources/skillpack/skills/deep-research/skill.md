---
name: deep-research
description: 5개 검색 API를 병렬로 실행하여 종합적인 리서치를 수행합니다. "리서치해줘", "조사해줘", "찾아봐", "검색해줘", "deep dive" 등의 키워드에 반응합니다.
---

# Deep Research Skill

사용자가 리서치를 요청하면 5개 API를 병렬로 실행하여 종합적인 결과를 제공합니다.

## 필수 환경 변수

API 키를 `~/.zshenv` 또는 `~/.zshrc`에 설정하세요:

```bash
export BRAVE_API_KEY="your_key"
export TAVILY_API_KEY="your_key"
export PERPLEXITY_API_KEY="your_key"
export NAVER_CLIENT_ID="your_id"
export NAVER_CLIENT_SECRET="your_secret"
export YOUTUBE_API_KEY="your_key"
```

## 실행 단계

### STEP 0: API 키 로드 (필수)

```bash
# Claude Code의 Bash 세션은 비대화형이므로 명시적 로드 필요
source ~/.zshenv 2>/dev/null || source ~/.zshrc 2>/dev/null

# 확인
if [ -z "$BRAVE_API_KEY" ]; then
    echo "API keys not loaded"
    exit 1
fi
```

### STEP 1: 병렬 검색 실행

**5개 API를 동시에 실행:**

```bash
QUERY="검색할 내용"
KOREAN_QUERY="한국어 검색어"

# Brave (20개 결과)
curl -s "https://api.search.brave.com/res/v1/web/search?q=${QUERY}&count=20" \
  -H "X-Subscription-Token: $BRAVE_API_KEY" > /tmp/brave.json &

# Tavily (20개 + AI 요약)
curl -s -X POST "https://api.tavily.com/search" \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"${QUERY}\",\"search_depth\":\"advanced\",\"max_results\":20,\"include_answer\":\"advanced\"}" > /tmp/tavily.json &

# Perplexity (추론 + 인용)
curl -s -X POST "https://api.perplexity.ai/chat/completions" \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"sonar-reasoning-pro\",\"messages\":[{\"role\":\"user\",\"content\":\"${QUERY}\"}],\"return_citations\":true}" > /tmp/perplexity.json &

# Naver (한국어 10개)
curl -s "https://openapi.naver.com/v1/search/webkr.json?query=${KOREAN_QUERY}&display=10" \
  -H "X-Naver-Client-Id: $NAVER_CLIENT_ID" \
  -H "X-Naver-Client-Secret: $NAVER_CLIENT_SECRET" > /tmp/naver.json &

# YouTube (10개 비디오)
curl -s "https://www.googleapis.com/youtube/v3/search?part=snippet&q=${QUERY}&type=video&maxResults=10&key=$YOUTUBE_API_KEY" > /tmp/youtube.json &

wait
echo "모든 검색 완료"
```

### STEP 2: 결과 확인

```bash
echo "=== API 상태 ==="

# Brave
BRAVE_COUNT=$(jq -r '.web.results | length // 0' /tmp/brave.json 2>/dev/null || echo 0)
[ "$BRAVE_COUNT" -gt 0 ] && echo "✅ Brave: $BRAVE_COUNT" || echo "❌ Brave: 실패"

# Tavily
TAVILY_COUNT=$(jq -r '.results | length // 0' /tmp/tavily.json 2>/dev/null || echo 0)
[ "$TAVILY_COUNT" -gt 0 ] && echo "✅ Tavily: $TAVILY_COUNT" || echo "❌ Tavily: 실패"

# Perplexity
PPLX_LEN=$(jq -r '.choices[0].message.content | length // 0' /tmp/perplexity.json 2>/dev/null || echo 0)
[ "$PPLX_LEN" -gt 0 ] && echo "✅ Perplexity: ${PPLX_LEN}자" || echo "❌ Perplexity: 실패"

# Naver
NAVER_COUNT=$(jq -r '.items | length // 0' /tmp/naver.json 2>/dev/null || echo 0)
[ "$NAVER_COUNT" -gt 0 ] && echo "✅ Naver: $NAVER_COUNT" || echo "❌ Naver: 실패"

# YouTube
YT_COUNT=$(jq -r '.items | length // 0' /tmp/youtube.json 2>/dev/null || echo 0)
[ "$YT_COUNT" -gt 0 ] && echo "✅ YouTube: $YT_COUNT" || echo "❌ YouTube: 실패"
```

### STEP 3: 결과 통합

스크립트를 사용하여 결과를 통합합니다:

```bash
python3 ~/.claude/skills/deep-research/scripts/merge_results.py \
  --brave /tmp/brave.json \
  --tavily /tmp/tavily.json \
  --perplexity /tmp/perplexity.json \
  --naver /tmp/naver.json \
  --youtube /tmp/youtube.json \
  --output /tmp/merged_research.json
```

### STEP 4: 사용자에게 보고

통합된 결과를 바탕으로:

1. **핵심 발견사항** (3-5개 요약)
2. **출처별 정보**
   - 웹 검색 결과 (Brave, Tavily)
   - AI 분석 (Perplexity)
   - 한국어 자료 (Naver)
   - 영상 자료 (YouTube)
3. **참고 링크**

---

## API별 역할

| API | 역할 | 강점 |
|-----|------|------|
| **Brave** | 웹 검색 | 프라이버시, 다양한 결과 |
| **Tavily** | 웹 검색 + AI 요약 | 즉시 사용 가능한 요약 |
| **Perplexity** | 추론 + 인용 | 깊이 있는 분석 |
| **Naver** | 한국어 검색 | 한국 콘텐츠 |
| **YouTube** | 영상 검색 | 튜토리얼, 강의 |

---

## 에러 처리

| 에러 | 해결책 |
|------|--------|
| API 키 미로드 | `source ~/.zshenv` 실행 |
| Rate limit | 3초 대기 후 재시도 |
| 타임아웃 | 결과 수 줄이고 재시도 |
| Naver 인증 오류 | developers.naver.com에서 키 재발급 |

---

## 저장 기준

다음 조건을 만족하면 PKM에 저장:

- [ ] 여러 프로젝트에서 재사용 가능한 정보
- [ ] 다시 찾는데 15분 이상 걸리는 정보
- [ ] 여러 소스에서 교차 검증된 정보
- [ ] 기술 스펙 (API 문서, 라이브러리 버전)

저장 위치: `12_Research/{주제}_{년도}/`
