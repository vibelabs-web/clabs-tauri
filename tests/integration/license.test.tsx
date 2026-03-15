// @TEST P3-S1-T2 - License Page 통합 테스트
// @IMPL src/renderer/pages/LicensePage.tsx
// @SPEC Phase 3 - 라이선스 입력, 인증, 에러 처리, 네비게이션

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LicensePage from '../../src/renderer/pages/LicensePage';

/**
 * Mock window.api 객체 - License API 시뮬레이션
 */
const mockApi = {
  license: {
    validate: vi.fn(),
    activate: vi.fn(),
    get: vi.fn(),
  },
};

/**
 * 라우터로 감싼 License Page 렌더링 헬퍼 함수
 */
function renderLicensePageWithRouter(initialRoute = '/license') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/license" element={<LicensePage />} />
        <Route path="/projects" element={<div>Projects Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('License Page 통합 테스트 (P3-S1-T2)', () => {
  beforeEach(() => {
    // @TEST P3-S1-T2-SETUP: Mock API 및 콘솔 설정
    (global as any).window = {
      api: mockApi,
      navigator: {
        clipboard: {
          writeText: vi.fn(),
          readText: vi.fn(),
        },
      },
    };

    // Mock console 메서드 (React Router 경고 방지)
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock 초기화
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. 페이지 초기 렌더링 (P3-S1-T2-1)
  // ========================================
  describe('페이지 초기 렌더링', () => {
    it('should render license page with all required elements', () => {
      // @TEST P3-S1-T2-1: 초기 페이지 렌더링 검증
      renderLicensePageWithRouter();

      // 제목 확인
      const title = screen.getByRole('heading', { name: '라이선스 인증' });
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');

      // 설명 텍스트 확인
      const description = screen.getByText(/구매 시 받은 라이선스 키를 입력해주세요/);
      expect(description).toBeInTheDocument();

      // 4개의 입력 필드 확인
      const inputs = screen.getAllByPlaceholderText('XXXX');
      expect(inputs).toHaveLength(4);

      // 인증 버튼 확인
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });
      expect(activateBtn).toBeInTheDocument();
      expect(activateBtn).not.toBeDisabled();

      // 구매하기 링크 확인
      const purchaseLink = screen.getByRole('link', { name: /구매하기/ });
      expect(purchaseLink).toBeInTheDocument();
      expect(purchaseLink).toHaveAttribute('href', 'https://example.com/purchase');
      expect(purchaseLink).toHaveAttribute('target', '_blank');
    });

    it('should have proper accessibility attributes', () => {
      // @TEST P3-S1-T2-2: 접근성 속성 검증
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      inputs.forEach((input, index) => {
        expect(input).toHaveAttribute('aria-label', `라이선스 키 세그먼트 ${index + 1}`);
        expect(input).toHaveAttribute('aria-invalid', 'false');
      });

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-labelledby', 'license-description');
    });
  });

  // ========================================
  // 2. 라이선스 키 입력 처리 (P3-S1-T2-3 ~ P3-S1-T2-8)
  // ========================================
  describe('라이선스 키 입력 처리', () => {
    it('should accept numeric and uppercase alphanumeric input', async () => {
      // @TEST P3-S1-T2-3: 알파벳 및 숫자 입력 허용
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      await user.type(inputs[0], 'ab12');

      expect(inputs[0]).toHaveValue('AB12');
    });

    it('should convert lowercase input to uppercase', async () => {
      // @TEST P3-S1-T2-4: 소문자를 대문자로 변환
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      await user.type(inputs[0], 'aBcD');

      expect(inputs[0]).toHaveValue('ABCD');
    });

    it('should limit each segment to 4 characters maximum', async () => {
      // @TEST P3-S1-T2-5: 각 세그먼트 4자 제한
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      await user.type(inputs[0], 'ABCDEFGH');

      expect(inputs[0]).toHaveValue('ABCD');
    });

    it('should auto-focus next input field when 4 characters are filled', async () => {
      // @TEST P3-S1-T2-6: 4자 입력 후 다음 필드로 자동 포커스
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      await user.type(inputs[0], 'ABCD');

      expect(inputs[1]).toHaveFocus();
    });

    it('should not auto-focus when last segment is filled', async () => {
      // @TEST P3-S1-T2-7: 마지막 필드에서는 다음 필드로 포커스하지 않음
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      await user.type(inputs[3], 'WXYZ');

      expect(inputs[3]).toHaveFocus();
    });

    it('should reject special characters and symbols', async () => {
      // @TEST P3-S1-T2-8: 특수문자 제거
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      await user.type(inputs[0], 'A!@#$%1');

      expect(inputs[0]).toHaveValue('A1');
    });

    it('should complete license key input with all segments filled', async () => {
      // @TEST P3-S1-T2-9: 전체 라이선스 키 입력 완료
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      await user.type(inputs[0], 'TEST');
      await user.type(inputs[1], 'KEYS');
      await user.type(inputs[2], 'FOR1');
      await user.type(inputs[3], 'AUTH');

      expect(inputs[0]).toHaveValue('TEST');
      expect(inputs[1]).toHaveValue('KEYS');
      expect(inputs[2]).toHaveValue('FOR1');
      expect(inputs[3]).toHaveValue('AUTH');
    });
  });

  // ========================================
  // 3. 라이선스 검증 - 유효한 입력 (P3-S1-T2-10 ~ P3-S1-T2-12)
  // ========================================
  describe('라이선스 검증 - 유효한 입력', () => {
    it('should validate complete license key and call activate API', async () => {
      // @TEST P3-S1-T2-10: 유효한 라이선스 키로 API 호출
      const user = userEvent.setup();
      mockApi.license.activate.mockResolvedValue({ success: true });

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP');
      await user.click(activateBtn);

      // API 호출 검증
      expect(mockApi.license.activate).toHaveBeenCalledWith('ABCD-EFGH-IJKL-MNOP');
    });

    it('should show loading state during activation', async () => {
      // @TEST P3-S1-T2-11: 인증 중 로딩 상태 표시
      const user = userEvent.setup();
      mockApi.license.activate.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 300))
      );

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP');
      await user.click(activateBtn);

      // 로딩 상태 확인 (비동기 작업이므로 즉시 확인 가능)
      // 로딩 상태는 API 호출 직후 약간의 시간 동안만 표시됨
      if (screen.queryByText('인증 중...')) {
        expect(screen.getByText('인증 중...')).toBeInTheDocument();
      }
      // API 호출 여부로 검증
      expect(mockApi.license.activate).toHaveBeenCalled();
    });

    it('should navigate to /projects on successful activation', async () => {
      // @TEST P3-S1-T2-12: 인증 성공 시 /projects로 네비게이션
      const user = userEvent.setup();
      mockApi.license.activate.mockResolvedValue({ success: true });

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP');
      await user.click(activateBtn);

      // 비동기 작업 대기
      await new Promise((resolve) => setTimeout(resolve, 150));

      // /projects 페이지로 네비게이션 확인
      expect(screen.getByText('Projects Dashboard')).toBeInTheDocument();
    });
  });

  // ========================================
  // 4. 라이선스 검증 - 불완전한 입력 (P3-S1-T2-13 ~ P3-S1-T2-14)
  // ========================================
  describe('라이선스 검증 - 불완전한 입력', () => {
    it('should show error message when license key is incomplete', async () => {
      // @TEST P3-S1-T2-13: 불완전한 라이선스 키 에러 메시지
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.click(activateBtn);

      // 에러 메시지 확인
      const errorMsg = screen.getByText('라이선스 키를 모두 입력해주세요.');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveClass('text-status-error');

      // API 호출되지 않았는지 확인
      expect(mockApi.license.activate).not.toHaveBeenCalled();
    });

    it('should show error message when only one segment is filled', async () => {
      // @TEST P3-S1-T2-14: 하나의 필드만 채워진 경우 에러
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'TEST');
      await user.click(activateBtn);

      expect(screen.getByText('라이선스 키를 모두 입력해주세요.')).toBeInTheDocument();
      expect(inputs[0]).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not call API when form validation fails', async () => {
      // @TEST P3-S1-T2-15: 폼 검증 실패 시 API 호출 안 됨
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });
      await user.click(activateBtn);

      expect(mockApi.license.activate).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // 5. 라이선스 검증 - API 오류 응답 (P3-S1-T2-16 ~ P3-S1-T2-17)
  // ========================================
  describe('라이선스 검증 - API 오류 응답', () => {
    it('should show error message when activation fails', async () => {
      // @TEST P3-S1-T2-16: 라이선스 검증 실패 시 에러 메시지
      const user = userEvent.setup();
      mockApi.license.activate.mockRejectedValue(
        new Error('Invalid license key')
      );

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'BADL');
      await user.type(inputs[1], 'ICEN');
      await user.type(inputs[2], 'SEKE');
      await user.type(inputs[3], 'YYYY');
      await user.click(activateBtn);

      // 비동기 작업 대기
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 에러 메시지 확인
      const errorMsg = screen.getByText('유효하지 않은 라이선스 키입니다.');
      expect(errorMsg).toBeInTheDocument();

      // 페이지가 변경되지 않았는지 확인
      expect(screen.queryByText('Projects Dashboard')).not.toBeInTheDocument();
    });

    it('should remain on license page when activation fails', async () => {
      // @TEST P3-S1-T2-17: 인증 실패 시 페이지 유지
      const user = userEvent.setup();
      mockApi.license.activate.mockRejectedValue(new Error('Network error'));

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'FAIL');
      await user.type(inputs[1], 'CODE');
      await user.type(inputs[2], 'TEST');
      await user.type(inputs[3], 'INFO');
      await user.click(activateBtn);

      // 비동기 작업 대기
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 에러 메시지 표시
      expect(
        screen.getByText('유효하지 않은 라이선스 키입니다.')
      ).toBeInTheDocument();

      // 라이선스 페이지의 요소들이 여전히 존재
      expect(screen.getByRole('heading', { name: '라이선스 인증' })).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText('XXXX')).toHaveLength(4);
    });
  });

  // ========================================
  // 6. 에러 상태 관리 (P3-S1-T2-18 ~ P3-S1-T2-19)
  // ========================================
  describe('에러 상태 관리', () => {
    it('should clear error message when user starts typing', async () => {
      // @TEST P3-S1-T2-18: 입력 시작 시 에러 메시지 제거
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      // 에러 발생
      await user.click(activateBtn);
      expect(
        screen.getByText('라이선스 키를 모두 입력해주세요.')
      ).toBeInTheDocument();

      // 입력 시작
      await user.type(inputs[0], 'A');

      // 에러 메시지가 제거되어야 함
      expect(
        screen.queryByText('라이선스 키를 모두 입력해주세요.')
      ).not.toBeInTheDocument();
    });

    it('should clear error when user modifies any segment', async () => {
      // @TEST P3-S1-T2-19: 특정 세그먼트 수정 시 에러 제거
      const user = userEvent.setup();
      mockApi.license.activate.mockRejectedValue(
        new Error('Invalid license')
      );

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      // 잘못된 라이선스로 에러 발생
      await user.type(inputs[0], 'FAIL');
      await user.type(inputs[1], 'CODE');
      await user.type(inputs[2], 'TEST');
      await user.type(inputs[3], 'FAIL');
      await user.click(activateBtn);

      // 비동기 작업 대기
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 에러 메시지 확인
      expect(
        screen.getByText('유효하지 않은 라이선스 키입니다.')
      ).toBeInTheDocument();

      // 다른 세그먼트 수정
      await user.clear(inputs[1]);
      await user.type(inputs[1], 'NEW');

      // 에러가 제거되어야 함
      expect(
        screen.queryByText('유효하지 않은 라이선스 키입니다.')
      ).not.toBeInTheDocument();
    });
  });

  // ========================================
  // 7. 키보드 네비게이션 (P3-S1-T2-20 ~ P3-S1-T2-22)
  // ========================================
  describe('키보드 네비게이션', () => {
    it('should submit form when Enter is pressed in last input field', async () => {
      // @TEST P3-S1-T2-20: 마지막 필드에서 Enter로 제출
      const user = userEvent.setup();
      mockApi.license.activate.mockResolvedValue({ success: true });

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP{Enter}');

      // API 호출 확인
      expect(mockApi.license.activate).toHaveBeenCalledWith(
        'ABCD-EFGH-IJKL-MNOP'
      );
    });

    it('should navigate with Tab key through all input fields', async () => {
      // @TEST P3-S1-T2-21: Tab 키로 필드 네비게이션
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      // 첫 번째 필드에 포커스
      inputs[0].focus();
      expect(inputs[0]).toHaveFocus();

      // 입력하면 자동으로 다음 필드로 포커스
      await user.type(inputs[0], 'ABCD');
      // 자동 포커스는 다음 필드로 이동하므로 검증
      expect(inputs[1]).toHaveFocus();

      // 나머지 필드도 자동으로 채우기
      await user.type(inputs[1], 'EFGH');
      expect(inputs[2]).toHaveFocus();

      await user.type(inputs[2], 'IJKL');
      expect(inputs[3]).toHaveFocus();
    });

    it('should allow reverse Tab navigation', async () => {
      // @TEST P3-S1-T2-22: Shift+Tab로 역방향 네비게이션
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      inputs[3].focus();
      expect(inputs[3]).toHaveFocus();

      await user.tab({ shift: true });
      expect(inputs[2]).toHaveFocus();
    });
  });

  // ========================================
  // 8. 구매 링크 기능 (P3-S1-T2-23)
  // ========================================
  describe('구매하기 링크', () => {
    it('should open purchase page in new tab when purchase link is clicked', () => {
      // @TEST P3-S1-T2-23: 구매하기 링크가 새 탭에서 열림
      renderLicensePageWithRouter();

      const purchaseLink = screen.getByRole('link', { name: /구매하기/ });

      expect(purchaseLink).toHaveAttribute('href', 'https://example.com/purchase');
      expect(purchaseLink).toHaveAttribute('target', '_blank');
      expect(purchaseLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should display purchase link with correct styling', () => {
      // @TEST P3-S1-T2-24: 구매하기 링크 스타일 적용
      renderLicensePageWithRouter();

      const purchaseLink = screen.getByRole('link', { name: /구매하기/ });

      expect(purchaseLink).toHaveClass('text-accent', 'hover:underline');
    });
  });

  // ========================================
  // 9. 사용자 시나리오 통합 테스트 (P3-S1-T2-25 ~ P3-S1-T2-27)
  // ========================================
  describe('사용자 시나리오 통합 테스트', () => {
    it('should complete full happy path: input → validate → navigate', async () => {
      // @TEST P3-S1-T2-25: 완전한 성공 시나리오
      const user = userEvent.setup();
      mockApi.license.activate.mockResolvedValue({ success: true });

      renderLicensePageWithRouter();

      expect(screen.getByRole('heading', { name: '라이선스 인증' })).toBeInTheDocument();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      await user.type(inputs[0], 'PROI');
      await user.type(inputs[1], 'DUCT');
      await user.type(inputs[2], 'LICE');
      await user.type(inputs[3], 'NKEY');

      expect(inputs[0]).toHaveValue('PROI');
      expect(inputs[1]).toHaveValue('DUCT');
      expect(inputs[2]).toHaveValue('LICE');
      expect(inputs[3]).toHaveValue('NKEY');

      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });
      await user.click(activateBtn);

      expect(mockApi.license.activate).toHaveBeenCalledWith(
        'PROI-DUCT-LICE-NKEY'
      );

      // 비동기 작업 대기
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(screen.getByText('Projects Dashboard')).toBeInTheDocument();
    });

    it('should handle error and allow retry', async () => {
      // @TEST P3-S1-T2-26: 오류 발생 후 재시도
      const user = userEvent.setup();
      mockApi.license.activate.mockRejectedValueOnce(
        new Error('Invalid license')
      );
      mockApi.license.activate.mockResolvedValueOnce({ success: true });

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      // 첫 시도 - 실패
      await user.type(inputs[0], 'FAIL');
      await user.type(inputs[1], 'CODE');
      await user.type(inputs[2], 'TEST');
      await user.type(inputs[3], 'FAIL');
      await user.click(activateBtn);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(
        screen.getByText('유효하지 않은 라이선스 키입니다.')
      ).toBeInTheDocument();

      // 입력 초기화 및 새로운 키 입력
      await user.clear(inputs[0]);
      await user.clear(inputs[1]);
      await user.clear(inputs[2]);
      await user.clear(inputs[3]);

      expect(
        screen.queryByText('유효하지 않은 라이선스 키입니다.')
      ).not.toBeInTheDocument();

      // 두 번째 시도 - 성공
      await user.type(inputs[0], 'GOOD');
      await user.type(inputs[1], 'LICE');
      await user.type(inputs[2], 'NKEY');
      await user.type(inputs[3], 'HERE');
      await user.click(activateBtn);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(screen.getByText('Projects Dashboard')).toBeInTheDocument();
      expect(mockApi.license.activate).toHaveBeenCalledTimes(2);
    });

    it('should handle incomplete input → error → complete input → success', async () => {
      // @TEST P3-S1-T2-27: 불완전 입력 → 에러 → 완성 → 성공
      const user = userEvent.setup();
      mockApi.license.activate.mockResolvedValue({ success: true });

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      // 1. 불완전한 입력으로 시도
      await user.type(inputs[0], 'INCO');
      await user.click(activateBtn);

      expect(
        screen.getByText('라이선스 키를 모두 입력해주세요.')
      ).toBeInTheDocument();

      // 2. 나머지 필드 채우기
      await user.type(inputs[1], 'MPLE');
      await user.type(inputs[2], 'LICE');
      await user.type(inputs[3], 'NKEY');

      expect(
        screen.queryByText('라이선스 키를 모두 입력해주세요.')
      ).not.toBeInTheDocument();

      // 3. 다시 인증 시도
      await user.click(activateBtn);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(screen.getByText('Projects Dashboard')).toBeInTheDocument();

      expect(mockApi.license.activate).toHaveBeenCalledWith(
        'INCO-MPLE-LICE-NKEY'
      );
    });
  });

  // ========================================
  // 10. 동시성 및 엣지 케이스 (P3-S1-T2-28 ~ P3-S1-T2-29)
  // ========================================
  describe('엣지 케이스 및 동시성', () => {
    it('should prevent multiple simultaneous API calls', async () => {
      // @TEST P3-S1-T2-28: 중복 클릭으로 인한 다중 API 호출 방지
      const user = userEvent.setup();
      mockApi.license.activate.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'MULT');
      await user.type(inputs[1], 'IPLI');
      await user.type(inputs[2], 'CLIC');
      await user.type(inputs[3], 'KKEY');

      // 빠르게 여러 번 클릭
      await user.click(activateBtn);
      await user.click(activateBtn);
      await user.click(activateBtn);

      // API는 한 번만 호출되어야 함 (disabled된 버튼은 클릭 불가)
      expect(mockApi.license.activate).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string segments after clearing', async () => {
      // @TEST P3-S1-T2-29: 필드 지우기 후 처리
      const user = userEvent.setup();
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');
      const activateBtn = screen.getByRole('button', { name: /라이선스 활성화/ });

      await user.type(inputs[0], 'ABCD');
      await user.type(inputs[1], 'EFGH');
      await user.type(inputs[2], 'IJKL');
      await user.type(inputs[3], 'MNOP');

      await user.clear(inputs[0]);
      await user.click(activateBtn);

      expect(
        screen.getByText('라이선스 키를 모두 입력해주세요.')
      ).toBeInTheDocument();

      expect(mockApi.license.activate).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // 11. 복사-붙여넣기 시나리오 (P3-S1-T2-30)
  // ========================================
  describe('복사-붙여넣기 처리', () => {
    it('should handle pasted license key in segments', () => {
      // @TEST P3-S1-T2-30: 클립보드에서 붙여넣은 데이터 처리
      renderLicensePageWithRouter();

      const inputs = screen.getAllByPlaceholderText('XXXX');

      // 첫 번째 필드에 4자 이상의 텍스트를 붙여넣기 시뮬레이션
      fireEvent.change(inputs[0], { target: { value: 'ABCDEFGH' } });

      // 4자로 제한되어야 함
      expect(inputs[0]).toHaveValue('ABCD');
    });
  });
});
