// @TASK P3-S1-T1 - 라이선스 인증 화면 테스트
// @SPEC Phase 3 - 라이선스 키 입력 및 인증 기능
// @TEST tests/pages/LicensePage.test.tsx

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LicensePage from '../../src/renderer/pages/LicensePage';

// Mock window.api
const mockApi = {
  license: {
    validate: vi.fn(),
    activate: vi.fn(),
    get: vi.fn(),
  },
};

// 테스트용 래퍼 컴포넌트
function renderWithRouter(initialRoute = '/license') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/license" element={<LicensePage />} />
        <Route path="/projects" element={<div>Projects Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LicensePage', () => {
  beforeEach(() => {
    // Mock window.api
    (global as any).window = {
      api: mockApi,
    };

    // Reset mocks
    vi.clearAllMocks();

    // Mock console.error to avoid React Router warnings
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('1. 초기 렌더링', () => {
    it('should render license page with title and description', () => {
      renderWithRouter();

      expect(screen.getByText('라이선스 인증')).toBeInTheDocument();
      expect(screen.getByText(/구매 시 받은 라이선스 키를 입력해주세요/)).toBeInTheDocument();
    });

    it('should render 4 input fields for license key', () => {
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      expect(inputs).toHaveLength(4);
    });

    it('should render activate button', () => {
      renderWithRouter();

      expect(screen.getByRole('button', { name: /라이선스 활성화/ })).toBeInTheDocument();
    });

    it('should render purchase link', () => {
      renderWithRouter();

      const link = screen.getByRole('link', { name: /구매하기/ });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com/purchase');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('2. 라이선스 키 입력 (XXXX-XXXX-XXXX-XXXX)', () => {
    it('should accept alphanumeric input in uppercase', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      await user.type(inputs[0], 'ab12');

      expect(inputs[0]).toHaveValue('AB12');
    });

    it('should limit each segment to 4 characters', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      await user.type(inputs[0], 'ABCDEF');

      expect(inputs[0]).toHaveValue('ABCD');
    });

    it('should auto-focus next input when 4 characters entered', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      await user.type(inputs[0], 'ABCD');

      expect(inputs[1]).toHaveFocus();
    });

    it('should not auto-focus when last segment is filled', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      await user.type(inputs[3], 'WXYZ');

      expect(inputs[3]).toHaveFocus();
    });

    it('should reject non-alphanumeric characters', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      await user.type(inputs[0], 'A!@#1');

      expect(inputs[0]).toHaveValue('A1');
    });
  });

  describe('3. 인증하기 버튼', () => {
    it('should show error if license key is incomplete', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const button = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.click(button);

      expect(await screen.findByText('라이선스 키를 모두 입력해주세요.')).toBeInTheDocument();
    });

    it('should call license activate API when complete key is entered', async () => {
      const user = userEvent.setup();
      mockApi.license.activate.mockResolvedValue({ success: true });
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const button = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP');
      await user.click(button);

      await waitFor(() => {
        expect(mockApi.license.activate).toHaveBeenCalledWith('ABCD-EFGH-IJKL-MNOP');
      });
    });

    it('should show loading state while activating', async () => {
      const user = userEvent.setup();
      mockApi.license.activate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const button = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP');
      await user.click(button);

      expect(screen.getByText('인증 중...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should navigate to /projects on successful activation', async () => {
      const user = userEvent.setup();
      mockApi.license.activate.mockResolvedValue({ success: true });
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const button = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Projects Page')).toBeInTheDocument();
      });
    });
  });

  describe('4. 에러 메시지 표시', () => {
    it('should show error message when activation fails', async () => {
      const user = userEvent.setup();
      mockApi.license.activate.mockRejectedValue(new Error('Invalid license'));
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const button = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP');
      await user.click(button);

      expect(await screen.findByText('유효하지 않은 라이선스 키입니다.')).toBeInTheDocument();
    });

    it('should clear error when user starts typing again', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const button = screen.getByRole('button', { name: /라이선스 활성화/ });

      // 에러 발생
      await user.click(button);
      expect(await screen.findByText('라이선스 키를 모두 입력해주세요.')).toBeInTheDocument();

      // 입력 시작 → 에러 제거
      await user.type(inputs[0], 'A');

      await waitFor(() => {
        expect(screen.queryByText('라이선스 키를 모두 입력해주세요.')).not.toBeInTheDocument();
      });
    });
  });

  describe('5. 접근성 (ARIA)', () => {
    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      // Tab으로 포커스 이동
      await user.tab();
      expect(inputs[0]).toHaveFocus();

      await user.tab();
      expect(inputs[1]).toHaveFocus();
    });

    it('should associate error message with form', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const button = screen.getByRole('button', { name: /라이선스 활성화/ });
      await user.click(button);

      const errorMessage = await screen.findByText('라이선스 키를 모두 입력해주세요.');
      expect(errorMessage).toHaveClass('text-status-error');
    });

    it('should have proper heading hierarchy', () => {
      renderWithRouter();

      const heading = screen.getByRole('heading', { name: '라이선스 인증' });
      expect(heading.tagName).toBe('H1');
    });
  });

  describe('6. 키보드 네비게이션', () => {
    it('should submit form on Enter key in last input', async () => {
      const user = userEvent.setup();
      mockApi.license.activate.mockResolvedValue({ success: true });
      renderWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP{Enter}');

      await waitFor(() => {
        expect(mockApi.license.activate).toHaveBeenCalled();
      });
    });
  });
});
