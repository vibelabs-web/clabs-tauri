// @TASK P2-S4-T1 - StatusBar 컴포넌트 테스트
// @SPEC 토큰, 컨텍스트, 일일 사용량, 태스크 시간 표시 상태바

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBar from '../../src/renderer/components/layout/StatusBar';

describe('StatusBar', () => {
  describe('토큰 카운트 표시', () => {
    it('현재 토큰 수를 렌더링한다', () => {
      const usage = {
        tokensUsed: 1500,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 120,
      };

      render(<StatusBar usage={usage} />);

      expect(screen.getByText(/1,500/)).toBeInTheDocument();
    });

    it('토큰 수를 천 단위 구분자로 포맷한다', () => {
      const usage = {
        tokensUsed: 150000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 120,
      };

      render(<StatusBar usage={usage} />);

      expect(screen.getByText(/150,000/)).toBeInTheDocument();
    });
  });

  describe('컨텍스트 프로그레스 바', () => {
    it('컨텍스트 사용률을 퍼센티지로 표시한다', () => {
      const usage = {
        tokensUsed: 100000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 120,
      };

      render(<StatusBar usage={usage} />);

      // 50% 사용
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('프로그레스 바 너비가 사용률과 일치한다', () => {
      const usage = {
        tokensUsed: 75000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 120,
      };

      const { container } = render(<StatusBar usage={usage} />);

      // 37.5% 사용
      const progressBar = container.querySelector('[data-testid="context-progress"]');
      expect(progressBar).toHaveStyle({ width: '37.5%' });
    });
  });

  describe('스펙트럼 색상 그라디언트', () => {
    it('0-50% 사용 시 녹색 계열을 표시한다', () => {
      const usage = {
        tokensUsed: 50000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 120,
      };

      const { container } = render(<StatusBar usage={usage} />);

      const progressBar = container.querySelector('[data-testid="context-progress"]');
      const className = progressBar?.className || '';
      expect(className).toMatch(/bg-green|text-green/);
    });

    it('50-75% 사용 시 노란색 계열을 표시한다', () => {
      const usage = {
        tokensUsed: 120000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 120,
      };

      const { container } = render(<StatusBar usage={usage} />);

      const progressBar = container.querySelector('[data-testid="context-progress"]');
      const className = progressBar?.className || '';
      expect(className).toMatch(/bg-yellow|text-yellow/);
    });

    it('75-90% 사용 시 주황색 계열을 표시한다', () => {
      const usage = {
        tokensUsed: 160000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 120,
      };

      const { container } = render(<StatusBar usage={usage} />);

      const progressBar = container.querySelector('[data-testid="context-progress"]');
      const className = progressBar?.className || '';
      expect(className).toMatch(/bg-orange|text-orange/);
    });

    it('90-100% 사용 시 빨간색 계열을 표시한다', () => {
      const usage = {
        tokensUsed: 185000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 120,
      };

      const { container } = render(<StatusBar usage={usage} />);

      const progressBar = container.querySelector('[data-testid="context-progress"]');
      const className = progressBar?.className || '';
      expect(className).toMatch(/bg-red|text-red/);
    });
  });

  describe('일일 사용량 표시', () => {
    it('일일 토큰 사용량을 표시한다', () => {
      const usage = {
        tokensUsed: 10000,
        contextLimit: 200000,
        dailyTokensUsed: 75000,
        taskDuration: 120,
      };

      render(<StatusBar usage={usage} />);

      expect(screen.getByText(/75,000/)).toBeInTheDocument();
    });
  });

  describe('태스크 소요 시간 표시', () => {
    it('태스크 시간을 초 단위로 표시한다', () => {
      const usage = {
        tokensUsed: 10000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 45,
      };

      render(<StatusBar usage={usage} />);

      expect(screen.getByText(/45s/)).toBeInTheDocument();
    });

    it('태스크 시간을 분:초 형식으로 표시한다', () => {
      const usage = {
        tokensUsed: 10000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 125,
      };

      render(<StatusBar usage={usage} />);

      // 125초 = 2분 5초
      expect(screen.getByText(/2m 5s/)).toBeInTheDocument();
    });
  });

  describe('반응형 레이아웃', () => {
    it('모든 정보가 한 줄에 표시된다', () => {
      const usage = {
        tokensUsed: 10000,
        contextLimit: 200000,
        dailyTokensUsed: 50000,
        taskDuration: 120,
      };

      const { container } = render(<StatusBar usage={usage} />);

      const statusBar = container.querySelector('[data-testid="status-bar"]');
      expect(statusBar).toHaveClass('flex');
    });
  });
});
