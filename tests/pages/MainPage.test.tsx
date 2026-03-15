// @TASK P2-S7-T1 - MainPage 통합 테스트
// @SPEC Worktree Phase 2 - 메인 페이지 전체 통합 및 상태 관리

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainPage from '../../src/renderer/pages/MainPage';

// Mock TerminalView 컴포넌트 (xterm.js 관련 에러 방지)
vi.mock('../../src/renderer/components/terminal/TerminalView', () => ({
  TerminalView: ({ onData }: { onData?: (data: string) => void }) => (
    <div data-testid="terminal-container">
      <div data-testid="terminal-output">Mock Terminal</div>
    </div>
  ),
}));

// Mock window.api
const mockApi = {
  pty: {
    spawn: vi.fn(),
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
    onData: vi.fn(() => vi.fn()),
    onExit: vi.fn(() => vi.fn()),
  },
  skills: {
    list: vi.fn(),
    execute: vi.fn(),
  },
  config: {
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn(),
  },
  projects: {
    list: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    open: vi.fn(),
  },
  window: {
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
  license: {
    validate: vi.fn(),
    activate: vi.fn(),
    get: vi.fn(),
  },
  update: {
    check: vi.fn(),
    download: vi.fn(),
    onProgress: vi.fn(() => vi.fn()),
  },
};

describe('MainPage Integration', () => {
  beforeEach(() => {
    // Mock window.api
    (global as any).window = {
      api: mockApi,
    };

    // Reset mocks
    vi.clearAllMocks();

    // Default mock responses
    mockApi.skills.list.mockResolvedValue([
      { name: '/socrates', command: '/socrates', category: 'planning', description: '21개 질문' },
      { name: '/screen-spec', command: '/screen-spec', category: 'planning', description: '화면 명세' },
      { name: '/auto-orchestrate', command: '/auto', category: 'implementation', description: '자동 개발' },
    ]);

    mockApi.config.getAll.mockResolvedValue({
      theme: 'dark',
      language: 'ko',
      terminal: {
        fontSize: 14,
        fontFamily: 'Monaco',
        cursorStyle: 'block',
        cursorBlink: true,
        scrollback: 1000,
      },
      skillpack: {
        autoUpdate: true,
        skillsPath: '~/.claude/skills',
      },
    });

    mockApi.projects.list.mockResolvedValue([]);
  });

  describe('1. 초기 렌더링', () => {
    it('should render main page layout', async () => {
      render(<MainPage />);

      // 레이아웃 구조 확인
      expect(screen.getByTestId('main-page')).toBeInTheDocument();
      expect(screen.getByTestId('title-bar')).toBeInTheDocument();
      expect(screen.getByTestId('skill-panel')).toBeInTheDocument();
      expect(screen.getByTestId('terminal-view')).toBeInTheDocument();
      expect(screen.getByTestId('input-box')).toBeInTheDocument();
      expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    });

    it('should load skills on mount', async () => {
      render(<MainPage />);

      await waitFor(() => {
        expect(mockApi.skills.list).toHaveBeenCalledTimes(1);
      });

      // 스킬이 화면에 표시되는지 확인
      expect(await screen.findByText('/socrates')).toBeInTheDocument();
      expect(await screen.findByText('/screen-spec')).toBeInTheDocument();
      expect(await screen.findByText('/auto-orchestrate')).toBeInTheDocument();
    });

    it('should initialize PTY on mount', async () => {
      render(<MainPage />);

      await waitFor(() => {
        expect(mockApi.pty.spawn).toHaveBeenCalledWith('claude', expect.any(String));
      });
    });
  });

  describe('2. IPC 통신', () => {
    it('should execute skill via IPC when skill button clicked', async () => {
      const user = userEvent.setup();
      render(<MainPage />);

      // 스킬 로드 대기
      const socratesButton = await screen.findByText('/socrates');

      // 스킬 버튼 클릭
      await user.click(socratesButton);

      // IPC 호출 확인
      expect(mockApi.skills.execute).toHaveBeenCalledWith('/socrates');
    });

    it('should write to PTY when input submitted', async () => {
      const user = userEvent.setup();
      render(<MainPage />);

      const inputBox = await screen.findByPlaceholderText(/메시지를 입력하세요/);

      // 입력 및 전송
      await user.type(inputBox, 'Hello Claude{Enter}');

      await waitFor(() => {
        expect(mockApi.pty.write).toHaveBeenCalledWith('Hello Claude\n');
      });
    });

    it('should receive PTY data and update terminal', async () => {
      const onDataCallback = vi.fn();
      mockApi.pty.onData.mockImplementation((callback) => {
        onDataCallback.mockImplementation(callback);
        return vi.fn();
      });

      render(<MainPage />);

      // PTY 데이터 수신 시뮬레이션
      await waitFor(() => {
        expect(mockApi.pty.onData).toHaveBeenCalled();
      });

      const callback = mockApi.pty.onData.mock.calls[0][0];
      callback('$ claude\nWelcome to Claude Code!\n');

      // 터미널에 출력되었는지 확인
      await waitFor(() => {
        expect(screen.getByTestId('terminal-output')).toHaveTextContent('Welcome to Claude Code');
      });
    });
  });

  describe('3. 상태 관리', () => {
    it('should manage terminal status state', async () => {
      render(<MainPage />);

      // 초기 상태는 idle
      expect(screen.getByTestId('terminal-status')).toHaveTextContent('idle');

      // 스킬 실행 시 running으로 변경
      const socratesButton = await screen.findByText('/socrates');
      await userEvent.click(socratesButton);

      await waitFor(() => {
        expect(screen.getByTestId('terminal-status')).toHaveTextContent('running');
      });
    });

    it('should manage skills list state', async () => {
      render(<MainPage />);

      // 스킬 목록 로드
      await waitFor(() => {
        expect(screen.getByTestId('skills-count')).toHaveTextContent('3');
      });
    });

    it('should update usage state from PTY data', async () => {
      const onDataCallback = vi.fn();
      mockApi.pty.onData.mockImplementation((callback) => {
        onDataCallback.mockImplementation(callback);
        return vi.fn();
      });

      render(<MainPage />);

      await waitFor(() => {
        expect(mockApi.pty.onData).toHaveBeenCalled();
      });

      // 사용량 데이터 수신
      const callback = mockApi.pty.onData.mock.calls[0][0];
      callback('USAGE: {"input": 1234, "output": 567, "total": 1801}');

      await waitFor(() => {
        expect(screen.getByTestId('token-usage')).toHaveTextContent('1,801');
      });
    });

    it('should persist project state', async () => {
      mockApi.projects.list.mockResolvedValue([
        {
          path: '/test/project',
          name: 'Test Project',
          lastOpened: new Date(),
          skillpackVersion: '1.0.0',
        },
      ]);

      render(<MainPage />);

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Test Project');
      });
    });
  });

  describe('4. 워크플로우 통합', () => {
    it('should display workflow progress', async () => {
      render(<MainPage />);

      // 워크플로우 섹션 존재 확인
      expect(screen.getByLabelText('워크플로우 진행 상황')).toBeInTheDocument();
    });

    it('should update workflow when skill executed', async () => {
      const user = userEvent.setup();
      render(<MainPage />);

      const socratesButton = await screen.findByText('/socrates');
      await user.click(socratesButton);

      // 워크플로우 상태 업데이트 확인
      await waitFor(() => {
        const workflowStep = screen.getByText('/socrates').closest('[data-status]');
        expect(workflowStep).toHaveAttribute('data-status', 'completed');
      });
    });
  });

  describe('5. 에러 처리', () => {
    it('should handle skill list load error', async () => {
      mockApi.skills.list.mockRejectedValue(new Error('Failed to load skills'));

      render(<MainPage />);

      await waitFor(() => {
        expect(screen.getByText('스킬 목록을 불러올 수 없습니다')).toBeInTheDocument();
      });
    });

    it('should handle PTY spawn error', async () => {
      mockApi.pty.spawn.mockRejectedValue(new Error('PTY spawn failed'));

      render(<MainPage />);

      await waitFor(() => {
        expect(screen.getByText(/터미널 초기화 실패/)).toBeInTheDocument();
      });
    });

    it('should handle IPC communication error', async () => {
      mockApi.skills.execute.mockImplementation(() => {
        throw new Error('IPC error');
      });

      const user = userEvent.setup();
      render(<MainPage />);

      const socratesButton = await screen.findByText('/socrates');
      await user.click(socratesButton);

      await waitFor(() => {
        expect(screen.getByText(/명령 실행 실패/)).toBeInTheDocument();
      });
    });
  });

  describe('6. 접근성', () => {
    it('should have proper ARIA landmarks', () => {
      render(<MainPage />);

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('complementary')).toBeInTheDocument(); // aside
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MainPage />);

      // Tab으로 포커스 이동
      await user.tab();
      expect(await screen.findByText('/socrates')).toHaveFocus();

      // Enter로 실행
      await user.keyboard('{Enter}');
      expect(mockApi.skills.execute).toHaveBeenCalledWith('/socrates');
    });
  });

  describe('7. 정리 (cleanup)', () => {
    it('should cleanup PTY on unmount', () => {
      const { unmount } = render(<MainPage />);

      unmount();

      expect(mockApi.pty.kill).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe from PTY events on unmount', () => {
      const unsubscribeData = vi.fn();
      const unsubscribeExit = vi.fn();

      mockApi.pty.onData.mockReturnValue(unsubscribeData);
      mockApi.pty.onExit.mockReturnValue(unsubscribeExit);

      const { unmount } = render(<MainPage />);

      unmount();

      expect(unsubscribeData).toHaveBeenCalledTimes(1);
      expect(unsubscribeExit).toHaveBeenCalledTimes(1);
    });
  });
});
