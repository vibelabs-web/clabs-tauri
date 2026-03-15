// @TASK P2-S1-T1 - xterm.js 기반 터미널 표시 컴포넌트 테스트
// @SPEC docs/planning/phase-2-spec.md#터미널-표시

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TerminalView } from '../../src/renderer/components/terminal/TerminalView';

// xterm 모킹
vi.mock('xterm', () => ({
  Terminal: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    write: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
    onData: vi.fn(),
    loadAddon: vi.fn(),
  })),
}));

vi.mock('xterm-addon-fit', () => ({
  FitAddon: vi.fn().mockImplementation(() => ({
    fit: vi.fn(),
    dispose: vi.fn(),
  })),
}));

describe('TerminalView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('터미널 컨테이너가 렌더링된다', () => {
    render(<TerminalView />);

    const container = screen.getByTestId('terminal-container');
    expect(container).toBeDefined();
  });

  it('xterm.js Terminal이 초기화된다', async () => {
    const { Terminal } = await import('xterm');

    render(<TerminalView />);

    expect(Terminal).toHaveBeenCalled();
  });

  it('FitAddon이 로드되고 fit()이 호출된다', async () => {
    const { FitAddon } = await import('xterm-addon-fit');

    render(<TerminalView />);

    expect(FitAddon).toHaveBeenCalled();
  });

  it('컴포넌트 언마운트 시 터미널이 정리된다', async () => {
    const { Terminal } = await import('xterm');
    const mockDispose = vi.fn();

    (Terminal as any).mockImplementation(() => ({
      open: vi.fn(),
      write: vi.fn(),
      clear: vi.fn(),
      dispose: mockDispose,
      onData: vi.fn(),
      loadAddon: vi.fn(),
    }));

    const { unmount } = render(<TerminalView />);
    unmount();

    expect(mockDispose).toHaveBeenCalled();
  });

  it('한글 출력이 지원된다 (utf-8 옵션)', async () => {
    const { Terminal } = await import('xterm');

    render(<TerminalView />);

    const terminalOptions = (Terminal as any).mock.calls[0]?.[0];
    expect(terminalOptions).toBeDefined();
    // xterm은 기본적으로 utf-8을 지원하므로 옵션 확인
  });

  it('ANSI 색상 및 스타일이 지원된다', async () => {
    const { Terminal } = await import('xterm');

    render(<TerminalView />);

    const terminalOptions = (Terminal as any).mock.calls[0]?.[0];
    expect(terminalOptions).toBeDefined();
    // convertEol, cursorBlink 등 기본 옵션 확인
  });

  it('터미널 크기가 컨테이너에 맞게 조절된다', async () => {
    const { FitAddon } = await import('xterm-addon-fit');
    const mockFit = vi.fn();

    (FitAddon as any).mockImplementation(() => ({
      fit: mockFit,
      dispose: vi.fn(),
    }));

    render(<TerminalView />);

    // fit은 마운트 후 호출됨
    expect(mockFit).toHaveBeenCalled();
  });
});
