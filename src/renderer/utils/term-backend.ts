// 터미널 백엔드 선택 — PaneView, MainPage 등 여러 곳에서 공통으로 참조.
// 우선순위: alac (default) > ghostty > xterm.
// localStorage:
//   clabs.useXterm    — xterm.js 폴백 강제
//   clabs.useGhostty  — libghostty 강제
// 둘 다 없으면 alac.

import { invoke } from '@tauri-apps/api/core';

export type TermBackend = 'alac' | 'ghostty' | 'xterm';

export const TERM_BACKEND: TermBackend = (() => {
  if (typeof window === 'undefined') return 'xterm';
  if (localStorage.getItem('clabs.useXterm') === 'true') return 'xterm';
  if (localStorage.getItem('clabs.useGhostty') === 'true') return 'ghostty';
  return 'alac';
})();

/**
 * 외부(InputBox 등)에서 paneId의 PTY로 텍스트를 보낸다.
 * 백엔드에 따라 적절한 IPC 채널로 라우팅.
 */
export function writeToPty(paneId: string, data: string): void {
  if (TERM_BACKEND === 'alac') {
    invoke('alac_write', { paneId, data }).catch((e) =>
      console.warn('[writeToPty alac] failed', e),
    );
  } else if (window.api?.pty) {
    window.api.pty.write(data, paneId);
  }
}
