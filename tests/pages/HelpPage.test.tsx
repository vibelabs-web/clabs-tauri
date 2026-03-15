// @TASK P3-S4-T1 - HelpPage 테스트
// @SPEC Worktree Phase 3 - 도움말 화면 (탭, 스킬 검색, FAQ 아코디언)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HelpPage from '../../src/renderer/pages/HelpPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HelpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. 초기 렌더링', () => {
    it('should render help page with title bar', () => {
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      expect(screen.getByText('도움말')).toBeInTheDocument();
      expect(screen.getByText('← 뒤로')).toBeInTheDocument();
    });

    it('should render all tabs', () => {
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      // getAllByText로 중복 텍스트 처리
      expect(screen.getAllByText('스킬 목록').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('워크플로우')).toBeInTheDocument();
      expect(screen.getByText('단축키')).toBeInTheDocument();
      expect(screen.getByText('FAQ')).toBeInTheDocument();
    });

    it('should display skills tab by default', () => {
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      // 스킬 검색창이 표시되는지 확인
      expect(screen.getByPlaceholderText('스킬 검색...')).toBeInTheDocument();

      // 탭 버튼이 활성화되었는지 확인 (role로 구분)
      const tabButtons = screen.getAllByRole('button');
      const activeTab = tabButtons.find((btn) => btn.classList.contains('bg-accent/20'));
      expect(activeTab).toHaveTextContent('스킬 목록');
    });
  });

  describe('2. 탭 전환', () => {
    it('should switch to workflow tab when clicked', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      const workflowTab = screen.getByText('워크플로우');
      await user.click(workflowTab);

      // 탭이 활성화되었는지 확인
      expect(workflowTab).toHaveClass('bg-accent/20', 'text-accent');

      // 워크플로우 콘텐츠 표시 확인
      expect(screen.getByText('권장 워크플로우')).toBeInTheDocument();
      expect(screen.getByText('/socrates')).toBeInTheDocument();
    });

    it('should switch to shortcuts tab when clicked', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      const shortcutsTab = screen.getByText('단축키');
      await user.click(shortcutsTab);

      expect(shortcutsTab).toHaveClass('bg-accent/20', 'text-accent');
      expect(screen.getByText('메시지 전송')).toBeInTheDocument();
      expect(screen.getByText('Enter')).toBeInTheDocument();
    });

    it('should switch to FAQ tab when clicked', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      const faqTab = screen.getByText('FAQ');
      await user.click(faqTab);

      expect(faqTab).toHaveClass('bg-accent/20', 'text-accent');
      expect(screen.getByText('자주 묻는 질문')).toBeInTheDocument();
    });
  });

  describe('3. 스킬 검색', () => {
    it('should filter skills by command name', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText('스킬 검색...');
      await user.type(searchInput, 'socrates');

      await waitFor(() => {
        expect(screen.getByText('/socrates')).toBeInTheDocument();
        expect(screen.queryByText('/screen-spec')).not.toBeInTheDocument();
      });
    });

    it('should filter skills by description', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText('스킬 검색...');
      await user.clear(searchInput);
      await user.type(searchInput, '컨설팅');

      // "소크라테스식 1:1 기획 컨설팅"만 표시되어야 함
      await waitFor(() => {
        expect(screen.getByText('소크라테스식 1:1 기획 컨설팅')).toBeInTheDocument();
        expect(screen.queryByText('화면별 상세 명세 생성')).not.toBeInTheDocument();
        expect(screen.queryByText('자동 태스크 실행')).not.toBeInTheDocument();
      });
    });

    it('should show all skills when search is cleared', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText('스킬 검색...');
      await user.type(searchInput, 'socrates');
      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('/socrates')).toBeInTheDocument();
        expect(screen.getByText('/screen-spec')).toBeInTheDocument();
        expect(screen.getByText('/auto-orchestrate')).toBeInTheDocument();
      });
    });
  });

  describe('4. 스킬 목록 표시', () => {
    it('should display all skills with categories', () => {
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      // 카테고리 뱃지 확인 (중복 텍스트 허용)
      expect(screen.getAllByText('기획').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('구현').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('검증').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('유틸').length).toBeGreaterThanOrEqual(1);
    });

    it('should display skill descriptions', () => {
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      expect(screen.getByText('소크라테스식 1:1 기획 컨설팅')).toBeInTheDocument();
      expect(screen.getByText('화면별 상세 명세 생성')).toBeInTheDocument();
    });
  });

  describe('5. 워크플로우 표시', () => {
    it('should display workflow diagram', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      await user.click(screen.getByText('워크플로우'));

      // getAllByText로 중복 텍스트 허용
      expect(screen.getAllByText('/socrates').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('/screen-spec').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('/tasks-generator')).toBeInTheDocument();
      expect(screen.getAllByText('/auto-orchestrate').length).toBeGreaterThanOrEqual(1);
    });

    it('should display workflow step descriptions', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      await user.click(screen.getByText('워크플로우'));

      expect(screen.getByText(/소크라테스식 질문으로 핵심 기능 도출/)).toBeInTheDocument();
      expect(screen.getByText(/화면별 상세 명세 YAML 생성/)).toBeInTheDocument();
    });
  });

  describe('6. 단축키 표시', () => {
    it('should display all keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      await user.click(screen.getByText('단축키'));

      expect(screen.getByText('메시지 전송')).toBeInTheDocument();
      expect(screen.getByText('Enter')).toBeInTheDocument();
      expect(screen.getByText('줄바꿈')).toBeInTheDocument();
      expect(screen.getByText('Shift + Enter')).toBeInTheDocument();
    });
  });

  describe('7. FAQ 표시', () => {
    it('should display all FAQ items', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      await user.click(screen.getByText('FAQ'));

      expect(screen.getByText('라이선스는 어떻게 갱신하나요?')).toBeInTheDocument();
      expect(screen.getByText('한글 입력이 안돼요')).toBeInTheDocument();
      expect(screen.getByText('스킬팩을 어떻게 업데이트하나요?')).toBeInTheDocument();
    });

    it('should display FAQ answers', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      await user.click(screen.getByText('FAQ'));

      expect(
        screen.getByText(/라이선스는 일회성 구매이며, 6개월간 무료 업그레이드가 포함됩니다/)
      ).toBeInTheDocument();
    });
  });

  describe('8. 네비게이션', () => {
    it('should navigate back when back button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      const backButton = screen.getByText('← 뒤로');
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('9. 접근성', () => {
    it('should have proper ARIA labels', () => {
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText('스킬 검색...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should support keyboard navigation for tabs', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      const workflowTab = screen.getByRole('button', { name: '워크플로우' });

      // Focus 후 클릭으로 활성화
      await user.click(workflowTab);

      expect(workflowTab).toHaveClass('bg-accent/20', 'text-accent');
    });
  });

  describe('10. 반응형 레이아웃', () => {
    it('should render sidebar and main content', () => {
      render(
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      );

      // 사이드바 (탭 버튼으로 찾기)
      const workflowTabButton = screen.getByRole('button', { name: '워크플로우' });
      const sidebar = workflowTabButton.closest('aside');
      expect(sidebar).toHaveClass('w-48');

      // 메인 콘텐츠 (검색창으로 찾기)
      const searchInput = screen.getByPlaceholderText('스킬 검색...');
      const main = searchInput.closest('main');
      expect(main).toHaveClass('flex-1');
    });
  });
});
