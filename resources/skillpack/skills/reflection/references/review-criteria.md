# Reflection 검토 기준

## 심각도 분류

### Critical (즉시 수정 필수)

| 카테고리 | 기준 |
|----------|------|
| 보안 | SQL Injection, XSS, 하드코딩된 비밀번호 |
| 로직 | 무한 루프, 널 참조, 데이터 손실 가능성 |
| 성능 | O(n²) 이상 복잡도 (대량 데이터), 메모리 누수 |
| 기능 | 요구사항 미충족, 핵심 기능 오류 |

### Major (권장 수정)

| 카테고리 | 기준 |
|----------|------|
| 보안 | 불충분한 입력 검증, 민감 정보 로깅 |
| 로직 | 엣지 케이스 미처리, 부적절한 에러 핸들링 |
| 성능 | 불필요한 DB 쿼리, N+1 문제 |
| 설계 | 단일 책임 원칙 위반, 과도한 의존성 |
| 가독성 | 타입 힌트 누락, 복잡한 중첩 구조 |

### Minor (선택 수정)

| 카테고리 | 기준 |
|----------|------|
| 스타일 | 일관성 없는 네이밍, 긴 줄 |
| 문서화 | docstring 부족, 주석 부족 |
| 최적화 | 미세 성능 개선 가능 |
| 구조 | 리팩토링으로 개선 가능 |

---

## 언어별 체크리스트

### Python

```python
# Critical
- [ ] SQL Injection (f-string 쿼리)
- [ ] eval(), exec() 사용
- [ ] pickle 신뢰할 수 없는 데이터

# Major
- [ ] 타입 힌트 누락
- [ ] async/await 일관성
- [ ] 예외 처리 누락
- [ ] 로깅 부족

# Minor
- [ ] PEP 8 스타일
- [ ] docstring 형식
```

### TypeScript/JavaScript

```typescript
// Critical
- [ ] innerHTML 직접 할당 (XSS)
- [ ] any 타입 남용
- [ ] 동기 파일 I/O

// Major
- [ ] 타입 가드 누락
- [ ] 에러 바운더리 없음
- [ ] useEffect 의존성 누락
- [ ] 메모이제이션 누락 (대량 렌더링)

// Minor
- [ ] 일관된 export 스타일
- [ ] 함수 컴포넌트 vs 화살표 함수
```

### SQL

```sql
-- Critical
- [ ] 동적 쿼리 (파라미터 바인딩 없음)
- [ ] DROP/TRUNCATE 직접 실행
- [ ] 권한 없는 테이블 접근

-- Major
- [ ] 인덱스 없는 대량 조회
- [ ] SELECT * 사용
- [ ] N+1 쿼리 패턴

-- Minor
- [ ] 쿼리 포맷팅
- [ ] 명시적 컬럼 순서
```

---

## 패턴별 검토

### API 엔드포인트

```
□ 입력 검증 (Pydantic/Zod)
□ 인증/인가 체크
□ Rate Limiting 고려
□ 응답 형식 일관성
□ 에러 응답 표준화
□ 로깅 (요청/응답)
□ 타임아웃 설정
```

### 데이터베이스 접근

```
□ 트랜잭션 경계
□ 커넥션 풀 사용
□ 인덱스 활용
□ N+1 방지
□ 락 최소화
□ 마이그레이션 롤백 가능
```

### UI 컴포넌트

```
□ 접근성 (ARIA)
□ 키보드 네비게이션
□ 로딩/에러 상태
□ 반응형 디자인
□ 메모이제이션
□ 이벤트 핸들러 최적화
```

### 테스트 코드

```
□ Arrange-Act-Assert 구조
□ 테스트 독립성
□ 모킹 적절성
□ 엣지 케이스 커버
□ 테스트 이름 명확성
□ 불필요한 테스트 없음
```

---

## 점수 산정 기준

### 기본 점수: 100점

```
Critical 1개당: -20점
Major 1개당: -5점
Minor 1개당: -1점

최소 점수: 0점
```

### 등급

| 점수 | 등급 | 의미 |
|------|------|------|
| 90-100 | A | 프로덕션 준비 완료 |
| 80-89 | B | 약간의 개선 권장 |
| 70-79 | C | 개선 필요 |
| 60-69 | D | 상당한 개선 필요 |
| 0-59 | F | 재작성 권장 |

---

## 자동 감지 패턴

### Python 위험 패턴

```python
# SQL Injection
rf".*\b(execute|query)\s*\(\s*f['\"]"

# 하드코딩된 비밀번호
r"(password|secret|api_key)\s*=\s*['\"][^'\"]+['\"]"

# eval 사용
r"\beval\s*\("
```

### JavaScript 위험 패턴

```javascript
// XSS
/innerHTML\s*=/

// 하드코딩된 토큰
/(token|apiKey|secret)\s*[:=]\s*['"][^'"]+['"]/

// console.log (프로덕션)
/console\.(log|debug|info)/
```

---

## 개선 템플릿

### 보안 취약점 수정

```markdown
**문제**: SQL Injection 취약점
**위치**: `app/api/users.py:45`
**원본**:
\`\`\`python
query = f"SELECT * FROM users WHERE id = {user_id}"
\`\`\`
**수정**:
\`\`\`python
query = select(User).where(User.id == user_id)
\`\`\`
**이유**: SQLAlchemy ORM 사용으로 파라미터 바인딩 자동 적용
```

### 성능 개선

```markdown
**문제**: N+1 쿼리 패턴
**위치**: `app/api/posts.py:23`
**원본**:
\`\`\`python
posts = db.query(Post).all()
for post in posts:
    print(post.author.name)  # 각 post마다 쿼리 발생
\`\`\`
**수정**:
\`\`\`python
posts = db.query(Post).options(joinedload(Post.author)).all()
for post in posts:
    print(post.author.name)  # 미리 로드됨
\`\`\`
**이유**: Eager loading으로 단일 쿼리로 해결
```
