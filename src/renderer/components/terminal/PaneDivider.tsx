// PaneDivider - 패인 사이 드래그 리사이즈 핸들

import { useCallback, useRef } from 'react';
import type { SplitDirection } from '@shared/pane-types';

export interface PaneDividerProps {
  direction: SplitDirection;
  onResize: (delta: number) => void;
}

export function PaneDivider({ direction, onResize }: PaneDividerProps) {
  const draggingRef = useRef(false);
  const lastPosRef = useRef(0);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize; // 항상 최신 콜백 참조

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    lastPosRef.current = direction === 'vertical' ? e.clientX : e.clientY;

    // 드래그 중 xterm 이벤트 가로채기 방지용 오버레이
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:' +
      (direction === 'vertical' ? 'col-resize' : 'row-resize');
    document.body.appendChild(overlay);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current) return;
      const currentPos = direction === 'vertical' ? moveEvent.clientX : moveEvent.clientY;
      const delta = currentPos - lastPosRef.current;
      lastPosRef.current = currentPos;
      if (delta !== 0) onResizeRef.current(delta);
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      overlay.remove();
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  const isVertical = direction === 'vertical';

  return (
    <div
      style={{
        flexShrink: 0,
        [isVertical ? 'width' : 'height']: '6px',
        cursor: isVertical ? 'col-resize' : 'row-resize',
        background: 'transparent',
        position: 'relative',
        zIndex: 1,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 가운데 시각적 라인 (2px) */}
      <div
        style={{
          position: 'absolute',
          [isVertical ? 'left' : 'top']: '2px',
          [isVertical ? 'width' : 'height']: '2px',
          [isVertical ? 'top' : 'left']: 0,
          [isVertical ? 'bottom' : 'right']: 0,
          background: 'var(--color-border-default, #333)',
          borderRadius: '1px',
        }}
      />
    </div>
  );
}
