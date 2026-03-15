# 컴포넌트 타입 목록

화면 명세에서 사용할 수 있는 컴포넌트 타입과 각 타입별 필수 속성입니다.

---

## 타입 분류

| 분류 | 타입 | 설명 |
|------|------|------|
| 네비게이션 | `navigation`, `breadcrumb`, `tabs`, `stepper` | 화면 이동 및 위치 표시 |
| 컨트롤 | `button`, `input`, `select`, `checkbox`, `radio`, `toggle`, `slider` | 사용자 입력 |
| 리스트/그리드 | `list`, `grid`, `table`, `carousel` | 데이터 목록 표시 |
| 카드 | `card`, `summary-card`, `stat-card` | 정보 요약 표시 |
| 폼 | `form`, `search-form`, `filter-form` | 입력 폼 그룹 |
| 디스플레이 | `text`, `image`, `video`, `chart`, `map` | 정보 표시 |
| 피드백 | `alert`, `toast`, `modal`, `drawer`, `tooltip` | 사용자 피드백 |
| 레이아웃 | `container`, `section`, `divider`, `spacer` | 구조 배치 |

---

## 네비게이션 (Navigation)

### `navigation`

사이드바, 헤더 등의 네비게이션 메뉴

```yaml
type: navigation
layout:
  position: left-sidebar | top-header | bottom-tab
  width: string
  collapsed: boolean        # 축소 가능 여부
events:
  - trigger: 메뉴 아이템 클릭
    action: navigate(path)
    result: 해당 화면으로 이동
```

**필수 속성**: position, 최소 1개 이벤트

### `breadcrumb`

현재 위치 표시 네비게이션

```yaml
type: breadcrumb
layout:
  position: top
events:
  - trigger: 경로 클릭
    action: navigate(path)
    result: 해당 화면으로 이동
```

### `tabs`

탭 네비게이션

```yaml
type: tabs
layout:
  position: top | bottom
  variant: underline | boxed | pills
state:
  local:
    activeTab: string
events:
  - trigger: 탭 클릭
    action: setActiveTab(tabId)
    result: 해당 탭 콘텐츠 표시
```

### `stepper`

단계 진행 표시

```yaml
type: stepper
layout:
  orientation: horizontal | vertical
state:
  local:
    currentStep: number
    completedSteps: number[]
events:
  - trigger: 단계 클릭
    action: goToStep(stepNumber)
    result: 해당 단계로 이동 (완료된 단계만 가능)
```

---

## 컨트롤 (Control)

### `button`

액션 버튼

```yaml
type: button
layout:
  variant: primary | secondary | outline | ghost | danger
  size: sm | md | lg
events:
  - trigger: 클릭
    action: handleClick()
    result: 정의된 액션 실행
```

### `input`

텍스트 입력

```yaml
type: input
layout:
  inputType: text | email | password | number | tel | url
  placeholder: string
state:
  local:
    value: string
    error: string | null
events:
  - trigger: 입력
    action: setValue(value)
    result: 상태 업데이트
  - trigger: blur
    action: validate()
    result: 유효성 검사
```

### `select`

드롭다운 선택

```yaml
type: select
layout:
  multiple: boolean         # 다중 선택
  searchable: boolean       # 검색 가능
state:
  local:
    selected: string | string[]
events:
  - trigger: 옵션 선택
    action: setSelected(value)
    result: 선택 값 변경
```

### `checkbox`

체크박스

```yaml
type: checkbox
state:
  local:
    checked: boolean
events:
  - trigger: 클릭
    action: toggleChecked()
    result: 체크 상태 토글
```

### `toggle`

토글 스위치

```yaml
type: toggle
state:
  local:
    enabled: boolean
events:
  - trigger: 클릭
    action: toggleEnabled()
    result: 활성화 상태 토글
```

### `slider`

슬라이더

```yaml
type: slider
layout:
  min: number
  max: number
  step: number
state:
  local:
    value: number | [number, number]  # 단일 또는 범위
events:
  - trigger: 드래그
    action: setValue(value)
    result: 값 변경
```

---

## 리스트/그리드 (List/Grid)

### `list`

세로 목록

```yaml
type: list
layout:
  variant: simple | divided | card
  virtualized: boolean      # 가상화 (대량 데이터)
api:
  endpoint: string
  response:
    type: array
state:
  local:
    items: array
    loading: boolean
events:
  - trigger: 아이템 클릭
    action: onItemClick(item)
    result: 정의된 액션
children:
  - # 리스트 아이템 컴포넌트
```

### `grid`

그리드 목록

```yaml
type: grid
layout:
  columns: number | { sm: number, md: number, lg: number }
  gap: string
api:
  endpoint: string
events:
  - trigger: 스크롤 끝
    action: loadMore()
    result: 추가 아이템 로드
```

### `table`

테이블

```yaml
type: table
layout:
  sortable: boolean
  selectable: boolean
  pagination: boolean
state:
  local:
    sortBy: string
    sortOrder: asc | desc
    selectedRows: array
events:
  - trigger: 헤더 클릭
    action: setSortBy(column)
    result: 정렬 변경
  - trigger: 행 선택
    action: toggleRowSelection(rowId)
    result: 선택 상태 변경
```

### `carousel`

캐러셀/슬라이더

```yaml
type: carousel
layout:
  autoPlay: boolean
  interval: number
  showDots: boolean
  showArrows: boolean
state:
  local:
    currentIndex: number
events:
  - trigger: 화살표 클릭
    action: goToSlide(index)
    result: 해당 슬라이드로 이동
  - trigger: 스와이프
    action: nextSlide() | prevSlide()
    result: 다음/이전 슬라이드
```

---

## 카드 (Card)

### `card`

범용 카드

```yaml
type: card
layout:
  variant: vertical | horizontal
  clickable: boolean
  hoverable: boolean
events:
  - trigger: 클릭
    action: onClick()
    result: 정의된 액션
```

### `summary-card`

요약 정보 카드

```yaml
type: summary-card
layout:
  icon: string
  trend: up | down | neutral   # 트렌드 표시
```

### `stat-card`

통계 카드

```yaml
type: stat-card
layout:
  format: number | currency | percent
  comparison: boolean         # 이전 대비 표시
```

---

## 폼 (Form)

### `form`

범용 폼

```yaml
type: form
layout:
  direction: vertical | horizontal
state:
  local:
    values: object
    errors: object
    isSubmitting: boolean
events:
  - trigger: submit
    action: handleSubmit(values)
    result: 폼 제출
  - trigger: 필드 변경
    action: setFieldValue(field, value)
    result: 필드 값 업데이트
api:
  endpoint: string
  method: POST | PUT | PATCH
```

### `search-form`

검색 폼

```yaml
type: search-form
layout:
  instant: boolean            # 즉시 검색 (타이핑 시)
  debounce: number           # 디바운스 ms
events:
  - trigger: 검색
    action: search(query)
    result: 검색 결과 표시
```

### `filter-form`

필터 폼

```yaml
type: filter-form
layout:
  collapsible: boolean
  applyOnChange: boolean      # 변경 즉시 적용
events:
  - trigger: 필터 변경
    action: applyFilters(filters)
    result: 목록 필터링
  - trigger: 초기화 클릭
    action: resetFilters()
    result: 필터 초기화
```

---

## 디스플레이 (Display)

### `text`

텍스트 표시

```yaml
type: text
layout:
  variant: heading | body | caption | label
  truncate: number            # 줄 수 제한
```

### `image`

이미지

```yaml
type: image
layout:
  aspectRatio: string         # 16:9, 1:1 등
  objectFit: cover | contain | fill
  lazy: boolean              # 지연 로딩
events:
  - trigger: 클릭
    action: openLightbox()
    result: 라이트박스 열기
```

### `video`

비디오

```yaml
type: video
layout:
  autoPlay: boolean
  controls: boolean
  muted: boolean
events:
  - trigger: 재생/일시정지
    action: togglePlay()
    result: 재생 상태 변경
```

### `chart`

차트

```yaml
type: chart
layout:
  chartType: line | bar | pie | area | donut
  responsive: boolean
api:
  endpoint: string
```

### `map`

지도

```yaml
type: map
layout:
  provider: google | naver | kakao
  zoom: number
  center: { lat: number, lng: number }
events:
  - trigger: 마커 클릭
    action: onMarkerClick(markerId)
    result: 마커 정보 표시
```

---

## 피드백 (Feedback)

### `alert`

알림 배너

```yaml
type: alert
layout:
  variant: info | success | warning | error
  dismissible: boolean
events:
  - trigger: 닫기 클릭
    action: dismiss()
    result: 알림 닫기
```

### `toast`

토스트 메시지

```yaml
type: toast
layout:
  position: top-right | top-center | bottom-right | bottom-center
  duration: number           # 자동 닫힘 ms
```

### `modal`

모달 대화상자

```yaml
type: modal
layout:
  size: sm | md | lg | full
  closable: boolean
  backdrop: boolean          # 배경 클릭 시 닫기
state:
  local:
    isOpen: boolean
events:
  - trigger: 열기
    action: open()
    result: 모달 표시
  - trigger: 닫기
    action: close()
    result: 모달 닫기
```

### `drawer`

드로어

```yaml
type: drawer
layout:
  position: left | right | top | bottom
  size: string
state:
  local:
    isOpen: boolean
events:
  - trigger: 토글
    action: toggle()
    result: 열림/닫힘 토글
```

### `tooltip`

툴팁

```yaml
type: tooltip
layout:
  position: top | bottom | left | right
  trigger: hover | click
```

---

## 레이아웃 (Layout)

### `container`

컨테이너

```yaml
type: container
layout:
  maxWidth: string
  padding: string
  centered: boolean
```

### `section`

섹션

```yaml
type: section
layout:
  background: string
  padding: string
```

---

## 타입 선택 가이드

| 상황 | 권장 타입 |
|------|----------|
| 사이드바 메뉴 | `navigation` |
| 상품/콘텐츠 목록 | `grid` + `card` 자식 |
| 데이터 테이블 | `table` |
| 입력 폼 | `form` + 컨트롤 자식들 |
| 검색 | `search-form` |
| 필터 | `filter-form` |
| 통계 대시보드 | `stat-card` 또는 `chart` |
| 모달 확인창 | `modal` |
| 에러 표시 | `alert` |
| 임시 알림 | `toast` |
