---
name: agent-lifecycle
description: Agent lifecycle rules for creation, maintenance, and termination. Reference document for orchestrator.
tools: Read
model: haiku
---

생성 조건:
- 작업이 5개 이상의 파일을 포함할 때
- 병렬 작업이 가능할 때
- 전문화가 필요할 때

종료 조건:
- 3회 연속 잘못된 제안
- 컨텍스트 윈도우 > 85%
- 순환 편집 감지됨
