# TASKS 문서 생성 규칙

이 문서는 TASKS (06-tasks.md) 생성 시 반드시 따라야 하는 규칙입니다.

---

## 1. Phase 번호 규칙 (필수!)

**모든 태스크 ID에는 반드시 Phase 접두사를 포함해야 합니다!**

오케스트레이터가 서브에이전트를 호출할 때 Phase 번호로 Git Worktree 생성 여부를 결정합니다:
- **Phase 0** → main 브랜치에서 작업 (Worktree 불필요)
- **Phase 1+** → Git Worktree 생성 후 작업

| 올바른 형식 | 잘못된 형식 |
|-------------|-------------|
| `Phase 0, T0.1: 프로젝트 초기화` | `T0.1: 프로젝트 초기화` |
| `Phase 0, T0.5.2: 테스트 작성` | `T0.5.2: 테스트 작성` |
| `Phase 1, T1.1: 인증 API` | `T1.1: 인증 API` |
| `Phase 2, T2.1: 게시글 API` | `T2.1: 게시글 API` |

### Phase 번호 매핑

| 마일스톤 | Phase | 예시 |
|----------|-------|------|
| M0 (프로젝트 셋업) | Phase 0 | `Phase 0, T0.1` ~ `Phase 0, T0.4` |
| M0.5 (계약 & 테스트) | Phase 0 | `Phase 0, T0.5.1` ~ `Phase 0, T0.5.3` |
| M1 (FEAT-0 인증) | Phase 1 | `Phase 1, T1.1` ~ `Phase 1, T1.3` |
| M2 (FEAT-1 핵심기능) | Phase 2 | `Phase 2, T2.1` ~ `Phase 2, T2.3` |
| ... | Phase N | `Phase N, TN.X` |

---

## 2. TDD 워크플로우 규칙 (필수!)

**모든 태스크(Phase 1+)에는 반드시 TDD 사이클을 포함해야 합니다!**

### 태스크 필수 포함 요소

| 요소 | 설명 | 예시 |
|------|------|------|
| **TDD 상태** | RED → GREEN 표기 | `T2.1: API 구현 RED→GREEN` |
| **테스트 파일 경로** | 먼저 작성할 테스트 위치 | `tests/api/test_auth.py` |
| **구현 파일 경로** | 테스트 통과를 위한 구현 위치 | `app/routes/auth.py` |
| **TDD 사이클 명령어** | 실행할 테스트 명령어 | `pytest tests/api/test_auth.py` |
| **인수 조건** | 완료 판단 기준 | `[ ] 모든 테스트 통과` |
| **Git Worktree 명령어** | Phase 1+에서 worktree 생성 | `git worktree add ...` |

---

## 3. 태스크 템플릿

### Phase 0 태스크 (Worktree 불필요)

```markdown
### [] Phase 0, T0.X: {태스크명}

**담당**: {specialist-type}

**작업 내용**:
- {작업 1}
- {작업 2}

**산출물**:
- `{파일 경로}`

**완료 조건**:
- [ ] {조건 1}
- [ ] {조건 2}
```

### Phase 1+ 태스크 (Worktree + TDD 필수)

```markdown
### [] Phase N, TN.X: {태스크명} RED→GREEN

**담당**: {specialist-type}

**Git Worktree 설정**:
\`\`\`bash
# 1. Worktree 생성
git worktree add ../project-phase{N}-{feature} -b phase/{N}-{feature}
cd ../project-phase{N}-{feature}

# 2. 작업 완료 후 병합 (사용자 승인 필요)
# git checkout main
# git merge phase/{N}-{feature}
# git worktree remove ../project-phase{N}-{feature}
\`\`\`

**TDD 사이클**:

1. **RED**: 테스트 작성 (실패 확인)
   \`\`\`bash
   # 테스트 파일: {테스트 경로}
   pytest {테스트 경로} -v  # Expected: FAILED
   \`\`\`

2. **GREEN**: 최소 구현 (테스트 통과)
   \`\`\`bash
   # 구현 파일: {구현 경로}
   pytest {테스트 경로} -v  # Expected: PASSED
   \`\`\`

3. **REFACTOR**: 리팩토링 (테스트 유지)
   - 코드 정리
   - 중복 제거
   - 테스트 계속 통과 확인

**산출물**:
- `{테스트 파일 경로}` (테스트)
- `{구현 파일 경로}` (구현)

**인수 조건**:
- [ ] 테스트 먼저 작성됨 (RED 확인)
- [ ] 모든 테스트 통과 (GREEN)
- [ ] 커버리지 >= 80%

**완료 시**:
- [ ] 사용자 승인 후 main 브랜치에 병합
- [ ] worktree 정리: `git worktree remove ../project-phase{N}-{feature}`
```

---

## 4. 태스크 독립성 규칙 (필수!)

**각 태스크는 다른 태스크에 영향을 주지 않고 독립적으로 실행 가능해야 합니다.**

### 독립성 보장 원칙

| 원칙 | 설명 |
|------|------|
| **격리된 테스트** | 각 태스크의 테스트는 다른 태스크 완료 여부와 무관하게 실행 가능 |
| **Mock/Stub 활용** | 의존하는 기능은 Mock으로 대체하여 독립 개발 |
| **계약 기반 개발** | API 계약(interface)만 있으면 구현 없이도 테스트 작성 가능 |
| **Git Worktree 분리** | 각 Phase는 별도 worktree에서 작업하여 충돌 방지 |

### 의존성 있는 태스크 처리

의존성이 있는 경우, **Mock을 먼저 정의**하여 독립 개발 가능하게 합니다:

```markdown
### [] Phase 2, T2.3: TransactionForm 컴포넌트 RED→GREEN

**의존성**: T2.2 (TransactionRepository) - **Mock 사용으로 독립 개발 가능**

**Mock 설정**:
\`\`\`typescript
// src/mocks/transactionMock.ts
export const mockTransactionRepository = {
  create: vi.fn().mockResolvedValue({ id: 1, amount: 1000 }),
  getAll: vi.fn().mockResolvedValue([]),
};
\`\`\`

**TDD 사이클**: (위 템플릿과 동일)
```

---

## 5. 생성 전 필수 체크리스트

**TASKS 문서 생성 직전에 반드시 확인하세요!**

```
+---------------------------------------------------------------------+
|  TASKS 문서 생성 전 필수 체크                                         |
+---------------------------------------------------------------------+
|                                                                     |
|  [ ] 1. tasks-template.md를 먼저 READ 도구로 읽었는가?               |
|                                                                     |
|  [ ] 2. 모든 태스크 ID에 Phase 접두사가 포함되었는가?                 |
|         - Phase 0, T0.1 / Phase 1, T1.1 / Phase 2, T2.1            |
|                                                                     |
|  [ ] 3. 모든 Phase 1+ 태스크에 다음이 포함되었는가?                  |
|         - [ ] Git Worktree 설정 명령어                               |
|         - [ ] TDD 사이클 (RED → GREEN → REFACTOR)                   |
|         - [ ] 테스트 파일 경로                                       |
|         - [ ] 구현 파일 경로                                         |
|         - [ ] 테스트 실행 명령어                                     |
|         - [ ] 인수 조건 체크리스트                                   |
|                                                                     |
|  [ ] 4. 의존성 있는 태스크에 Mock 설정이 포함되었는가?               |
|                                                                     |
|  [ ] 5. 각 태스크가 독립적으로 실행 가능한가?                        |
|                                                                     |
+---------------------------------------------------------------------+
```

---

## 6. TASKS 문서 생성 순서

1. `tasks-template.md` 파일을 READ 도구로 읽기
2. 이 문서(tasks-generation-rules.md)의 규칙 확인
3. 위 체크리스트 항목 모두 충족 확인
4. 템플릿의 형식을 **정확히** 따라서 생성
5. 저장 전 최종 검토

---

## 7. 오케스트레이터 → 서브에이전트 호출 규칙

오케스트레이터가 서브에이전트를 호출할 때 다음 정보를 전달합니다:

```markdown
**태스크 정보**:
- Phase: {N}
- 태스크 ID: {TN.X}
- 담당: {specialist-type}

**Git Worktree** (Phase 1+ 시):
- 브랜치: phase/{N}-{feature}
- 경로: ../project-phase{N}-{feature}

**TDD 요구사항**:
- 테스트 파일: {테스트 경로}
- 구현 파일: {구현 경로}
- 테스트 명령어: {pytest/vitest 명령어}
```

서브에이전트는 이 정보를 받아 자동으로:
1. Git Worktree 생성 (Phase 1+)
2. 테스트 먼저 작성 (RED)
3. 구현 (GREEN)
4. 리팩토링 (REFACTOR)
5. 완료 보고 (사용자 병합 승인 대기)
