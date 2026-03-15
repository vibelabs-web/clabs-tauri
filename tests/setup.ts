// @TASK P2-S4-T1 - Vitest 테스트 환경 설정

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Testing Library 매처 추가
expect.extend(matchers);

// matchMedia 모킹 (xterm.js 지원)
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ResizeObserver 모킹
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// alert 모킹 (UpdatePage 지원)
globalThis.alert = vi.fn();

// navigator.clipboard 모킹 (userEvent 지원)
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
    configurable: true,
  });
} else {
  (global as any).navigator = {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
  };
}

// window.addEventListener/removeEventListener는 jsdom이 자동 제공

// 각 테스트 후 정리
afterEach(() => {
  cleanup();
});
