## 규칙: 파일 읽기 전에 항상 qmd 사용

파일 읽기나 디렉터리 탐색 전에 항상 qmd를 사용하여 로컬 프로젝트 내 정보를 검색하십시오.

사용 가능한 도구:
- `qmd search "query"` — 빠른 키워드 검색 (BM25)
- `qmd query "쿼리"` — 재정렬 포함 하이브리드 검색 (최고 품질)
- `qmd vsearch "쿼리"` — 의미 벡터 검색
- `qmd get <path>` — 특정 문서 검색

빠른 조회에는 qmd search를, 복잡한 질문에는 qmd query를 사용하십시오.
qmd가 충분한 결과를 반환하지 않을 때만 Read/Glob을 사용하십시오.
