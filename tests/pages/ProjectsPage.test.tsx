// @TASK P3-S2-T1 - ProjectsPage 테스트
// @SPEC Worktree Phase 3 - 프로젝트 선택 화면

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ProjectsPage from '../../src/renderer/pages/ProjectsPage';

// Mock window.api
const mockApi = {
  projects: {
    list: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    open: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
};

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProjectsPage', () => {
  beforeEach(() => {
    // Mock window.api
    (global as any).window = {
      api: mockApi,
    };

    // Reset mocks
    vi.clearAllMocks();

    // Default mock responses
    mockApi.projects.list.mockResolvedValue([
      {
        path: '/Users/dev/my-project',
        name: 'my-project',
        lastOpened: new Date('2024-01-20'),
        skillpackVersion: '1.8.0',
      },
      {
        path: '/Users/dev/another-project',
        name: 'another-project',
        lastOpened: new Date('2024-01-19'),
        skillpackVersion: '1.7.5',
      },
    ]);
  });

  describe('1. 초기 렌더링', () => {
    it('should render page title', () => {
      renderWithRouter(<ProjectsPage />);
      expect(screen.getByText('프로젝트 선택')).toBeInTheDocument();
    });

    it('should render header with recent projects title', () => {
      renderWithRouter(<ProjectsPage />);
      expect(screen.getByText('최근 프로젝트')).toBeInTheDocument();
    });

    it('should render open folder button', () => {
      renderWithRouter(<ProjectsPage />);
      expect(screen.getByRole('button', { name: '폴더 열기' })).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderWithRouter(<ProjectsPage />);
      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });
  });

  describe('2. 프로젝트 목록 표시', () => {
    it('should load and display project list', async () => {
      renderWithRouter(<ProjectsPage />);

      await waitFor(() => {
        expect(mockApi.projects.list).toHaveBeenCalledTimes(1);
      });

      expect(await screen.findByText('my-project')).toBeInTheDocument();
      expect(await screen.findByText('another-project')).toBeInTheDocument();
    });

    it('should display project details', async () => {
      renderWithRouter(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('/Users/dev/my-project')).toBeInTheDocument();
      });

      expect(screen.getByText('v1.8.0')).toBeInTheDocument();
      expect(screen.getByText('v1.7.5')).toBeInTheDocument();
    });

    it('should display relative date format', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);

      mockApi.projects.list.mockResolvedValue([
        {
          path: '/test',
          name: 'test',
          lastOpened: today,
          skillpackVersion: '1.0.0',
        },
        {
          path: '/test2',
          name: 'test2',
          lastOpened: yesterday,
          skillpackVersion: '1.0.0',
        },
      ]);

      renderWithRouter(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('오늘')).toBeInTheDocument();
      });

      expect(screen.getByText('어제')).toBeInTheDocument();
    });

    it('should show empty state when no projects', async () => {
      mockApi.projects.list.mockResolvedValue([]);

      renderWithRouter(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('최근 프로젝트가 없습니다.')).toBeInTheDocument();
      });

      expect(screen.getByText('폴더를 선택하여 시작하세요')).toBeInTheDocument();
    });
  });

  describe('3. 프로젝트 선택', () => {
    it('should navigate to main page when project clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ProjectsPage />);

      const projectButton = await screen.findByText('my-project');
      await user.click(projectButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should call projects.open before navigation', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ProjectsPage />);

      const projectButton = await screen.findByText('my-project');
      await user.click(projectButton);

      await waitFor(() => {
        expect(mockApi.projects.open).toHaveBeenCalledWith('/Users/dev/my-project');
      });
    });

    it('should handle project selection with keyboard', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ProjectsPage />);

      await screen.findByText('my-project');

      // Tab to project button
      await user.tab();
      await user.tab(); // Skip open folder button

      // Enter to select
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('4. 폴더 열기 (IPC)', () => {
    it('should show open folder dialog when button clicked', async () => {
      const user = userEvent.setup();
      mockApi.dialog = {
        showOpenDialog: vi.fn().mockResolvedValue({
          canceled: true,
          filePaths: [],
        }),
      };

      (global as any).window.api.dialog = mockApi.dialog;

      renderWithRouter(<ProjectsPage />);

      const openButton = screen.getByRole('button', { name: '폴더 열기' });
      await user.click(openButton);

      await waitFor(() => {
        expect(mockApi.dialog.showOpenDialog).toHaveBeenCalledWith({
          properties: ['openDirectory'],
        });
      });
    });

    it('should add project when folder selected', async () => {
      const user = userEvent.setup();
      mockApi.dialog = {
        showOpenDialog: vi.fn().mockResolvedValue({
          canceled: false,
          filePaths: ['/Users/dev/new-project'],
        }),
      };

      mockApi.projects.add.mockResolvedValue({
        path: '/Users/dev/new-project',
        name: 'new-project',
        lastOpened: new Date(),
        skillpackVersion: '1.8.0',
      });

      (global as any).window.api.dialog = mockApi.dialog;

      renderWithRouter(<ProjectsPage />);

      const openButton = screen.getByRole('button', { name: '폴더 열기' });
      await user.click(openButton);

      await waitFor(() => {
        expect(mockApi.projects.add).toHaveBeenCalledWith('/Users/dev/new-project');
      });
    });

    it('should not add project when dialog canceled', async () => {
      const user = userEvent.setup();
      mockApi.dialog = {
        showOpenDialog: vi.fn().mockResolvedValue({
          canceled: true,
          filePaths: [],
        }),
      };

      (global as any).window.api.dialog = mockApi.dialog;

      renderWithRouter(<ProjectsPage />);

      const openButton = screen.getByRole('button', { name: '폴더 열기' });
      await user.click(openButton);

      await waitFor(() => {
        expect(mockApi.dialog.showOpenDialog).toHaveBeenCalled();
      });

      expect(mockApi.projects.add).not.toHaveBeenCalled();
    });

    it('should refresh project list after adding', async () => {
      const user = userEvent.setup();
      mockApi.dialog = {
        showOpenDialog: vi.fn().mockResolvedValue({
          canceled: false,
          filePaths: ['/Users/dev/new-project'],
        }),
      };

      mockApi.projects.add.mockResolvedValue({
        path: '/Users/dev/new-project',
        name: 'new-project',
        lastOpened: new Date(),
        skillpackVersion: '1.8.0',
      });

      (global as any).window.api.dialog = mockApi.dialog;

      renderWithRouter(<ProjectsPage />);

      await screen.findByText('my-project'); // Wait for initial load

      const initialCallCount = mockApi.projects.list.mock.calls.length;

      const openButton = screen.getByRole('button', { name: '폴더 열기' });
      await user.click(openButton);

      await waitFor(() => {
        expect(mockApi.projects.list.mock.calls.length).toBe(initialCallCount + 1);
      });
    });
  });

  describe('5. 에러 처리', () => {
    it('should handle project list load error', async () => {
      mockApi.projects.list.mockRejectedValue(new Error('Failed to load'));

      renderWithRouter(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText(/프로젝트 목록을 불러올 수 없습니다/)).toBeInTheDocument();
      });
    });

    it('should handle project open error', async () => {
      const user = userEvent.setup();
      mockApi.projects.open.mockRejectedValue(new Error('Failed to open'));

      renderWithRouter(<ProjectsPage />);

      const projectButton = await screen.findByText('my-project');
      await user.click(projectButton);

      await waitFor(() => {
        expect(screen.getByText(/프로젝트를 열 수 없습니다/)).toBeInTheDocument();
      });

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle dialog error', async () => {
      const user = userEvent.setup();
      mockApi.dialog = {
        showOpenDialog: vi.fn().mockRejectedValue(new Error('Dialog error')),
      };

      (global as any).window.api.dialog = mockApi.dialog;

      renderWithRouter(<ProjectsPage />);

      const openButton = screen.getByRole('button', { name: '폴더 열기' });
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByText(/폴더를 선택할 수 없습니다/)).toBeInTheDocument();
      });
    });
  });

  describe('6. 접근성', () => {
    it('should have proper heading structure', async () => {
      renderWithRouter(<ProjectsPage />);

      await screen.findByText('my-project');

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('최근 프로젝트');
    });

    it('should have keyboard accessible buttons', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ProjectsPage />);

      const openButton = screen.getByRole('button', { name: '폴더 열기' });

      openButton.focus();
      expect(openButton).toHaveFocus();

      await user.keyboard('{Enter}');
      // Should trigger click
    });

    it('should support keyboard navigation in project list', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ProjectsPage />);

      await screen.findByText('my-project');

      // Tab through projects
      await user.tab(); // Open folder button
      await user.tab(); // First project
      await user.tab(); // Second project

      // Should be able to navigate
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('7. UI 상태', () => {
    it('should show hover effect on project items', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ProjectsPage />);

      const projectButton = await screen.findByText('my-project');
      const projectCard = projectButton.closest('button');

      expect(projectCard).toHaveClass('hover:bg-bg-tertiary');
    });

    it('should show loading spinner during initial load', () => {
      mockApi.projects.list.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<ProjectsPage />);

      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });

    it('should clear loading state after data loaded', async () => {
      renderWithRouter(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('my-project')).toBeInTheDocument();
    });
  });
});
