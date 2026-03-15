// @TASK P3-S3-T1 - SettingsPage 테스트
// @SPEC Phase 3 - 앱 설정 화면 (탭: 일반, 터미널, 스킬팩, 라이선스, 정보)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SettingsPage from '../../src/renderer/pages/SettingsPage';

// Mock window.api
const mockApi = {
  config: {
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn(),
  },
  license: {
    get: vi.fn(),
  },
  skills: {
    getVersion: vi.fn(),
  },
};

// 테스트용 래퍼
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SettingsPage', () => {
  beforeEach(() => {
    // Mock window.api
    (global as any).window = {
      api: mockApi,
    };

    // Reset mocks
    vi.clearAllMocks();

    // Default mock responses
    mockApi.config.getAll.mockResolvedValue({
      theme: 'dark',
      terminal: {
        fontSize: 14,
        cursorStyle: 'block',
      },
      skillpack: {
        autoUpdate: true,
      },
    });

    mockApi.license.get.mockResolvedValue({
      isActive: true,
      email: 'user@example.com',
      expiresAt: '2025-06-15',
    });

    mockApi.skills.getVersion.mockResolvedValue('1.8.0');
  });

  describe('1. 초기 렌더링', () => {
    it('should render settings page with all tabs', () => {
      renderWithRouter(<SettingsPage />);

      // 타이틀 확인
      expect(screen.getByText('설정')).toBeInTheDocument();

      // 5개 탭 확인
      expect(screen.getByText('일반')).toBeInTheDocument();
      expect(screen.getByText('터미널')).toBeInTheDocument();
      expect(screen.getByText('스킬팩')).toBeInTheDocument();
      expect(screen.getByText('라이선스')).toBeInTheDocument();
      expect(screen.getByText('정보')).toBeInTheDocument();
    });

    it('should render general tab by default', () => {
      renderWithRouter(<SettingsPage />);

      expect(screen.getByText('일반 설정')).toBeInTheDocument();
      expect(screen.getByLabelText('테마')).toBeInTheDocument();
    });

    it('should load config from IPC on mount', async () => {
      renderWithRouter(<SettingsPage />);

      await waitFor(() => {
        expect(mockApi.config.getAll).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('2. 탭 전환', () => {
    it('should switch to terminal tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const terminalTab = screen.getByText('터미널');
      await user.click(terminalTab);

      expect(screen.getByText('터미널 설정')).toBeInTheDocument();
      expect(screen.getByText(/폰트 크기:/)).toBeInTheDocument();
      expect(screen.getByLabelText('커서 스타일')).toBeInTheDocument();
    });

    it('should switch to skillpack tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const skillpackTab = screen.getByText('스킬팩');
      await user.click(skillpackTab);

      expect(screen.getByText('스킬팩 설정')).toBeInTheDocument();
      expect(screen.getByText('자동 업데이트')).toBeInTheDocument();
    });

    it('should switch to license tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const licenseTab = screen.getByText('라이선스');
      await user.click(licenseTab);

      expect(screen.getByText('라이선스')).toBeInTheDocument();
    });

    it('should switch to about tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const aboutTab = screen.getByText('정보');
      await user.click(aboutTab);

      expect(screen.getByText('정보')).toBeInTheDocument();
    });

    it('should highlight active tab', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const terminalTab = screen.getByText('터미널');
      await user.click(terminalTab);

      // 활성 탭은 accent 색상
      expect(terminalTab).toHaveClass('text-accent');
    });
  });

  describe('3. 일반 설정 (General)', () => {
    it('should display theme selector', () => {
      renderWithRouter(<SettingsPage />);

      const themeSelect = screen.getByLabelText('테마') as HTMLSelectElement;
      expect(themeSelect).toBeInTheDocument();
      expect(themeSelect.value).toBe('dark');
    });

    it('should change theme and save via IPC', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const themeSelect = screen.getByLabelText('테마') as HTMLSelectElement;
      await user.selectOptions(themeSelect, 'light');

      // 테마 변경 즉시 적용
      expect(themeSelect.value).toBe('light');

      // IPC 호출 확인 (디바운스로 인해 약간의 딜레이)
      await waitFor(
        () => {
          expect(mockApi.config.set).toHaveBeenCalledWith('theme', 'light');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('4. 터미널 설정 (Terminal)', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const terminalTab = screen.getByText('터미널');
      await user.click(terminalTab);
    });

    it('should display font size slider', () => {
      const slider = screen.getByRole('slider', { name: /폰트 크기/ }) as HTMLInputElement;
      expect(slider).toBeInTheDocument();
      expect(slider.value).toBe('14');
    });

    it('should change font size and save via IPC', async () => {
      const user = userEvent.setup();
      const slider = screen.getByRole('slider', { name: /폰트 크기/ }) as HTMLInputElement;

      await user.clear(slider);
      await user.type(slider, '18');

      // 값 변경 확인
      await waitFor(() => {
        expect(screen.getByText(/폰트 크기: 18px/)).toBeInTheDocument();
      });

      // IPC 호출 확인
      await waitFor(
        () => {
          expect(mockApi.config.set).toHaveBeenCalledWith('terminal.fontSize', 18);
        },
        { timeout: 1000 }
      );
    });

    it('should display cursor style selector', () => {
      const cursorSelect = screen.getByLabelText('커서 스타일') as HTMLSelectElement;
      expect(cursorSelect).toBeInTheDocument();
      expect(cursorSelect.value).toBe('block');
    });

    it('should change cursor style and save via IPC', async () => {
      const user = userEvent.setup();
      const cursorSelect = screen.getByLabelText('커서 스타일') as HTMLSelectElement;

      await user.selectOptions(cursorSelect, 'underline');

      expect(cursorSelect.value).toBe('underline');

      await waitFor(
        () => {
          expect(mockApi.config.set).toHaveBeenCalledWith('terminal.cursorStyle', 'underline');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('5. 스킬팩 설정 (Skillpack)', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const skillpackTab = screen.getByText('스킬팩');
      await user.click(skillpackTab);
    });

    it('should display auto-update toggle', () => {
      expect(screen.getByText('자동 업데이트')).toBeInTheDocument();
      expect(screen.getByText(/새 버전 출시 시 자동으로 알림/)).toBeInTheDocument();
    });

    it('should toggle auto-update and save via IPC', async () => {
      const user = userEvent.setup();

      // 토글 버튼 찾기 (role=switch)
      const toggle = screen.getByRole('switch', { name: /자동 업데이트/ });
      expect(toggle).toHaveAttribute('aria-checked', 'true');

      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'false');

      await waitFor(
        () => {
          expect(mockApi.config.set).toHaveBeenCalledWith('skillpack.autoUpdate', false);
        },
        { timeout: 1000 }
      );
    });

    it('should display skillpack version', async () => {
      await waitFor(() => {
        expect(mockApi.skills.getVersion).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByText(/v1.8.0/)).toBeInTheDocument();
    });
  });

  describe('6. 라이선스 (License)', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const licenseTab = screen.getByText('라이선스');
      await user.click(licenseTab);
    });

    it('should load license info from IPC', async () => {
      await waitFor(() => {
        expect(mockApi.license.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should display active license info', async () => {
      await waitFor(() => {
        expect(screen.getByText(/라이선스 활성화됨/)).toBeInTheDocument();
      });

      expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/2025-06-15/)).toBeInTheDocument();
    });

    it('should display inactive license when not activated', async () => {
      mockApi.license.get.mockResolvedValue({
        isActive: false,
      });

      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const licenseTab = screen.getByText('라이선스');
      await user.click(licenseTab);

      await waitFor(() => {
        expect(screen.getByText(/라이선스가 활성화되지 않았습니다/)).toBeInTheDocument();
      });
    });
  });

  describe('7. 정보 (About)', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const aboutTab = screen.getByText('정보');
      await user.click(aboutTab);
    });

    it('should display app version', () => {
      expect(screen.getByText(/버전:/)).toBeInTheDocument();
      expect(screen.getByText(/1.0.0/)).toBeInTheDocument();
    });

    it('should display Electron version', () => {
      expect(screen.getByText(/Electron:/)).toBeInTheDocument();
    });

    it('should display GitHub link', () => {
      const githubLink = screen.getByText('GitHub');
      expect(githubLink).toHaveAttribute('href', 'https://github.com/example/clabs');
      expect(githubLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('8. IPC 통신 에러 처리', () => {
    it('should handle config load error', async () => {
      mockApi.config.getAll.mockRejectedValue(new Error('Failed to load config'));

      renderWithRouter(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/설정을 불러올 수 없습니다/)).toBeInTheDocument();
      });
    });

    it('should handle config save error', async () => {
      mockApi.config.set.mockRejectedValue(new Error('Failed to save config'));

      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const themeSelect = screen.getByLabelText('테마') as HTMLSelectElement;
      await user.selectOptions(themeSelect, 'light');

      await waitFor(() => {
        expect(screen.getByText(/설정 저장에 실패했습니다/)).toBeInTheDocument();
      });
    });

    it('should handle license load error', async () => {
      mockApi.license.get.mockRejectedValue(new Error('License error'));

      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const licenseTab = screen.getByText('라이선스');
      await user.click(licenseTab);

      await waitFor(() => {
        expect(screen.getByText(/라이선스 정보를 불러올 수 없습니다/)).toBeInTheDocument();
      });
    });
  });

  describe('9. 접근성 (Accessibility)', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<SettingsPage />);

      expect(screen.getByRole('heading', { level: 2, name: '일반 설정' })).toBeInTheDocument();
    });

    it('should support keyboard navigation for tabs', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      // Tab으로 탭 버튼에 포커스
      await user.tab();
      await user.tab(); // 뒤로 버튼 건너뛰기

      const generalTab = screen.getByText('일반');
      expect(generalTab).toHaveFocus();

      // 화살표 키로 탭 이동
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('터미널')).toHaveFocus();
    });

    it('should have proper ARIA labels', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const terminalTab = screen.getByText('터미널');
      await user.click(terminalTab);

      const slider = screen.getByRole('slider', { name: /폰트 크기/ });
      expect(slider).toHaveAttribute('aria-valuemin', '10');
      expect(slider).toHaveAttribute('aria-valuemax', '24');
      expect(slider).toHaveAttribute('aria-valuenow', '14');
    });
  });

  describe('10. 즉시 적용 (Live Update)', () => {
    it('should apply theme change immediately', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const themeSelect = screen.getByLabelText('테마') as HTMLSelectElement;
      await user.selectOptions(themeSelect, 'light');

      // document.documentElement에 테마 클래스 적용 확인
      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
      });
    });

    it('should apply font size change immediately', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SettingsPage />);

      const terminalTab = screen.getByText('터미널');
      await user.click(terminalTab);

      const slider = screen.getByRole('slider', { name: /폰트 크기/ }) as HTMLInputElement;
      await user.clear(slider);
      await user.type(slider, '18');

      // CSS 변수 적용 확인
      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--terminal-font-size')).toBe('18px');
      });
    });
  });
});
