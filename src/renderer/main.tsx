import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// Tauri bridge: window.api 호환 래퍼 초기화
import './api/tauri-bridge';

// xterm.js 내부 오류 억제 (IdleTaskQueue, handleResize, dimensions 등)
window.addEventListener('error', (event) => {
  if (event.message?.includes('handleResize') ||
      event.message?.includes('IdleTaskQueue') ||
      event.message?.includes('dimensions') ||
      event.message?.includes('Viewport')) {
    event.preventDefault();
    return false;
  }
});

// Unhandled rejection도 억제
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('dimensions') ||
      event.reason?.message?.includes('handleResize')) {
    event.preventDefault();
  }
});

// Cmd+=/- 줌 (Tauri WKWebView는 기본 줌 단축키 미지원)
let currentZoom = 100;
window.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey)) return;
  if (e.key === '=' || e.key === '+') {
    e.preventDefault();
    currentZoom = Math.min(200, currentZoom + 10);
    (document.body.style as any).zoom = `${currentZoom}%`;
  } else if (e.key === '-') {
    e.preventDefault();
    currentZoom = Math.max(50, currentZoom - 10);
    (document.body.style as any).zoom = `${currentZoom}%`;
  } else if (e.key === '0') {
    e.preventDefault();
    currentZoom = 100;
    (document.body.style as any).zoom = '100%';
  }
});

// StrictMode 제거 - xterm.js와 충돌 방지
// HashRouter 사용 - file:// 프로토콜 호환
ReactDOM.createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>
);
