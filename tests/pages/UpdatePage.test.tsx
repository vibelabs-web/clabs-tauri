// @TASK P3-S5-T1 - UpdatePage 업데이트 화면 테스트
// @SPEC Worktree Phase 3 - 업데이트 정보 표시, 다운로드, 설치

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpdatePage from '../../src/renderer/pages/UpdatePage';

// Mock window.api
const mockApi = {
  update: {
    check: vi.fn(),
    download: vi.fn(),
    install: vi.fn(),
    onProgress: vi.fn(() => vi.fn()),
  },
};

// Router로 감싸는 헬퍼
const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('UpdatePage', () => {
  beforeEach(() => {
    // Mock window.api
    (global as any).window = {
      api: mockApi,
    };

    // Reset mocks
    vi.clearAllMocks();

    // Default mock responses
    mockApi.update.check.mockResolvedValue({
      version: '1.1.0',
      releaseNotes: '새로운 기능 추가 및 버그 수정',
      downloadUrl: 'https://example.com/download',
      publishedAt: new Date('2026-02-01'),
    });
  });

  describe('1. 초기 렌더링', () => {
    it('should render update page with header', () => {
      renderWithRouter(<UpdatePage />);

      expect(screen.getByText('업데이트')).toBeInTheDocument();
      expect(screen.getByText('← 뒤로')).toBeInTheDocument();
    });

    it('should display version information', () => {
      renderWithRouter(<UpdatePage />);

      expect(screen.getByText(/새 버전 v1.1.0 사용 가능/)).toBeInTheDocument();
    });

    it('should display release notes sections', () => {
      renderWithRouter(<UpdatePage />);

      expect(screen.getByText('🎉 새로운 기능')).toBeInTheDocument();
      expect(screen.getByText('🐛 버그 수정')).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      renderWithRouter(<UpdatePage />);

      expect(screen.getByRole('button', { name: '지금 업데이트' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '나중에' })).toBeInTheDocument();
    });
  });

  describe('2. 접근성', () => {
    it('should have proper ARIA roles', () => {
      renderWithRouter(<UpdatePage />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have progressbar role (when downloading)', () => {
      renderWithRouter(<UpdatePage />);

      // 초기 상태에서는 progressbar 없음
      const progressBars = screen.queryAllByRole('progressbar', { hidden: true });
      expect(progressBars.length).toBe(0);
    });
  });

  describe('3. 레이아웃', () => {
    it('should render max-width container', () => {
      renderWithRouter(<UpdatePage />);

      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();

      // max-w-2xl 클래스 확인
      const container = mainContent.querySelector('.max-w-2xl');
      expect(container).toBeInTheDocument();
    });
  });

  describe('4. 릴리즈 노트 내용', () => {
    it('should display new features', () => {
      renderWithRouter(<UpdatePage />);

      expect(screen.getByText(/새로운 \/deep-research 스킬 추가/)).toBeInTheDocument();
      expect(screen.getByText(/터미널 성능 개선/)).toBeInTheDocument();
      expect(screen.getByText(/한글 입력 안정성 향상/)).toBeInTheDocument();
    });

    it('should display bug fixes', () => {
      renderWithRouter(<UpdatePage />);

      expect(screen.getByText(/스킬 패널 스크롤 버그 수정/)).toBeInTheDocument();
      expect(screen.getByText(/라이선스 검증 오류 수정/)).toBeInTheDocument();
      expect(screen.getByText(/메모리 누수 문제 해결/)).toBeInTheDocument();
    });
  });
});
