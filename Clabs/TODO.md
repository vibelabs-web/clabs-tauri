# Clabs Swift 앱 — 남은 기능 구현 계획

## 완료된 기능
- [x] libghostty 터미널 (Metal + 한글 IME)
- [x] 멀티탭 (Cmd+T/W)
- [x] 스플릿 패인 (수평/수직)
- [x] 사이드바 (스킬 스캔 60개)
- [x] InputBox (자동완성, 히스토리, 기본 명령어)
- [x] 테마 시스템 (15 프리셋, 메뉴바)
- [x] CLI 빌더 (Cmd+Shift+B)
- [x] 설정 창 (Cmd+,)
- [x] Orchestrator 소켓 서버
- [x] StatusBar

## Phase 5: 핵심 누락 기능 (우선순위 순)

### 5A. 터미널 복사/붙여넣기 + 검색
- [ ] Cmd+C: 선택 텍스트 복사 (ghostty_surface_has_selection → read_selection)
- [ ] Cmd+V: 클립보드 붙여넣기 (ghostty_surface_text)
- [ ] Cmd+F: 검색바 표시 (ghostty_surface_binding_action "search")
- [ ] 마우스 드래그 선택

### 5B. 파일 탐색기
- [ ] FileTreeView: 프로젝트 디렉토리 트리 표시
- [ ] NSOutlineView 기반
- [ ] 파일 아이콘 (확장자별)
- [ ] 더블클릭 → 에디터 탭 열기
- [ ] 사이드바에 탭으로 전환 (스킬 | 파일)

### 5C. 파일 에디터
- [ ] EditorTabBar: 열린 파일 탭
- [ ] EditorView: NSTextView 기반 코드 편집
- [ ] 구문 강조 (기본)
- [ ] 저장 (Cmd+S)
- [ ] 수정 표시 (탭에 dot)

### 5D. 디자인 개선
- [ ] 사이드바 스타일 기존 Tauri 앱과 일치
- [ ] 탭바 디자인 개선 (활성 탭 하이라이트)
- [ ] 테마 변경 버튼 사이드바 하단에 추가
- [ ] InputBox 디자인 기존과 일치
- [ ] 전체 색감/간격 조정

### 5E. 터미널 UX
- [ ] 프로젝트별 작업 디렉토리 (working_directory 전달)
- [ ] URL 클릭 열기
- [ ] 고스트 텍스트 (AI 자동완성 제안 표시)
- [ ] 붙여넣기 안전 경고 (위험 명령어 감지)
- [ ] 터미널 스크롤백 설정

## Phase 6: 고급 기능
- [ ] Slack 브릿지
- [ ] 자동 업데이트 (Sparkle)
- [ ] 세션 저장/복원
- [ ] 멀티 인스턴스 통신
