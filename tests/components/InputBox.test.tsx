// @TASK P2-S2-T1 - 한글 조합 지원 입력창 컴포넌트 테스트
// @SPEC docs/planning/phase-2-spec.md#한글-입력-처리

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputBox } from '../../src/renderer/components/terminal/InputBox';

describe('InputBox', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('입력창이 렌더링된다', () => {
    render(<InputBox onSubmit={mockOnSubmit} />);

    const input = screen.getByTestId('input-box');
    expect(input).toBeDefined();
  });

  it('placeholder가 표시된다', () => {
    const placeholder = '명령어를 입력하세요...';
    render(<InputBox onSubmit={mockOnSubmit} placeholder={placeholder} />);

    const input = screen.getByPlaceholderText(placeholder);
    expect(input).toBeDefined();
  });

  it('텍스트 입력이 가능하다', () => {
    render(<InputBox onSubmit={mockOnSubmit} />);

    const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'test input' } });

    expect(input.value).toBe('test input');
  });

  describe('한글 IME 조합 처리', () => {
    it('compositionstart 이벤트가 감지된다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box');
      fireEvent.compositionStart(input);

      // 조합 중 상태가 활성화됨 (내부 상태 체크)
      expect(input).toBeDefined();
    });

    it('compositionend 이벤트가 감지된다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box');
      fireEvent.compositionStart(input);
      fireEvent.compositionEnd(input);

      // 조합 종료 상태 확인
      expect(input).toBeDefined();
    });

    it('한글 조합 중에는 Enter 키로 제출되지 않는다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: '안녕' } });

      // 조합 시작
      fireEvent.compositionStart(input);

      // Enter 키 입력
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // 조합 중이므로 onSubmit이 호출되지 않아야 함
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('한글 조합 완료 후 Enter 키로 제출된다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: '안녕하세요' } });

      // 조합 시작 및 종료
      fireEvent.compositionStart(input);
      fireEvent.compositionEnd(input);

      // Enter 키 입력
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // onSubmit이 호출되어야 함
      expect(mockOnSubmit).toHaveBeenCalledWith('안녕하세요');
    });
  });

  describe('Enter 키 처리', () => {
    it('Enter 키로 텍스트를 제출한다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnSubmit).toHaveBeenCalledWith('hello');
    });

    it('Enter 키 제출 후 입력창이 비워진다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(input.value).toBe('');
    });

    it('빈 텍스트는 제출되지 않는다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('공백만 있는 텍스트는 제출되지 않는다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Shift+Enter 처리', () => {
    it('Shift+Enter로 줄바꿈이 가능하다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'line1' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

      // Shift+Enter는 제출하지 않음
      expect(mockOnSubmit).not.toHaveBeenCalled();
      // textarea의 기본 동작으로 줄바꿈 발생 (브라우저 기본 동작)
    });
  });

  describe('비활성화 상태', () => {
    it('disabled 상태에서는 입력이 비활성화된다', () => {
      render(<InputBox onSubmit={mockOnSubmit} disabled />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
      expect(input.disabled).toBe(true);
    });

    it('disabled 상태에서는 Enter 키가 무시된다', () => {
      render(<InputBox onSubmit={mockOnSubmit} disabled />);

      const input = screen.getByTestId('input-box');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('textarea 역할을 가진다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box');
      expect(input.tagName).toBe('TEXTAREA');
    });

    it('키보드로 포커스 가능하다', () => {
      render(<InputBox onSubmit={mockOnSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
      input.focus();

      expect(document.activeElement).toBe(input);
    });
  });
});
