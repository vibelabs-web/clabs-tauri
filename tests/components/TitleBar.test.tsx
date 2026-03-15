// @TASK P2-S5-T1 - TitleBar 컴포넌트 테스트
// @SPEC docs/planning/phase-2.md#titlebar

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import TitleBar from '@/renderer/components/layout/TitleBar';

// Window API 모킹
const mockWindowApi = {
  minimize: vi.fn(),
  maximize: vi.fn(),
  close: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  window.api = {
    window: mockWindowApi,
  } as any;
});

describe('TitleBar', () => {
  describe('기본 렌더링', () => {
    it('앱 타이틀 "clabs"를 표시해야 함', () => {
      render(<TitleBar />);
      expect(screen.getByText('clabs')).toBeInTheDocument();
    });

    it('프로젝트명을 표시해야 함', () => {
      render(<TitleBar projectName="my-awesome-project" />);
      expect(screen.getByText('my-awesome-project')).toBeInTheDocument();
    });

    it('프로젝트명이 없으면 "프로젝트 없음"을 표시해야 함', () => {
      render(<TitleBar />);
      expect(screen.getByText('프로젝트 없음')).toBeInTheDocument();
    });
  });

  describe('창 컨트롤 버튼', () => {
    it('최소화, 최대화, 닫기 버튼이 표시되어야 함', () => {
      render(<TitleBar />);

      const minimizeBtn = screen.getByRole('button', { name: /minimize/i });
      const maximizeBtn = screen.getByRole('button', { name: /maximize/i });
      const closeBtn = screen.getByRole('button', { name: /close/i });

      expect(minimizeBtn).toBeInTheDocument();
      expect(maximizeBtn).toBeInTheDocument();
      expect(closeBtn).toBeInTheDocument();
    });

    it('최소화 버튼 클릭 시 window.minimize 호출', async () => {
      const user = userEvent.setup();
      render(<TitleBar />);

      const minimizeBtn = screen.getByRole('button', { name: /minimize/i });
      await user.click(minimizeBtn);

      expect(mockWindowApi.minimize).toHaveBeenCalledTimes(1);
    });

    it('최대화 버튼 클릭 시 window.maximize 호출', async () => {
      const user = userEvent.setup();
      render(<TitleBar />);

      const maximizeBtn = screen.getByRole('button', { name: /maximize/i });
      await user.click(maximizeBtn);

      expect(mockWindowApi.maximize).toHaveBeenCalledTimes(1);
    });

    it('닫기 버튼 클릭 시 window.close 호출', async () => {
      const user = userEvent.setup();
      render(<TitleBar />);

      const closeBtn = screen.getByRole('button', { name: /close/i });
      await user.click(closeBtn);

      expect(mockWindowApi.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('설정 버튼', () => {
    it('설정 버튼이 표시되어야 함', () => {
      render(<TitleBar />);
      const settingsBtn = screen.getByRole('button', { name: /settings/i });
      expect(settingsBtn).toBeInTheDocument();
    });

    it('설정 버튼 클릭 시 onSettingsClick 콜백 호출', async () => {
      const user = userEvent.setup();
      const handleSettingsClick = vi.fn();
      render(<TitleBar onSettingsClick={handleSettingsClick} />);

      const settingsBtn = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsBtn);

      expect(handleSettingsClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('드래그 영역', () => {
    it('TitleBar에 -webkit-app-region: drag 스타일이 적용되어야 함', () => {
      const { container } = render(<TitleBar />);
      const titleBar = container.firstChild as HTMLElement;

      // jsdom은 -webkit-app-region을 지원하지 않으므로 inline style 확인
      expect(titleBar.style.WebkitAppRegion).toBe('drag');
    });

    it('버튼 영역은 -webkit-app-region: no-drag 스타일이 적용되어야 함', () => {
      render(<TitleBar />);
      const minimizeBtn = screen.getByRole('button', { name: /minimize/i });

      // jsdom은 -webkit-app-region을 지원하지 않으므로 inline style 확인
      expect(minimizeBtn.style.WebkitAppRegion).toBe('no-drag');
    });
  });

  describe('접근성', () => {
    it('각 버튼은 명확한 aria-label을 가져야 함', () => {
      render(<TitleBar />);

      expect(screen.getByLabelText('Minimize window')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximize window')).toBeInTheDocument();
      expect(screen.getByLabelText('Close window')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });
  });

  describe('스타일링', () => {
    it('다크 모드 배경색을 사용해야 함', () => {
      const { container } = render(<TitleBar />);
      const titleBar = container.firstChild as HTMLElement;

      expect(titleBar).toHaveClass('bg-bg-secondary');
    });

    it('고정 높이 h-12를 가져야 함', () => {
      const { container } = render(<TitleBar />);
      const titleBar = container.firstChild as HTMLElement;

      expect(titleBar).toHaveClass('h-12');
    });
  });
});
