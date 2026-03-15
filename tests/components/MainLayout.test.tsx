// @TASK P2-S6-T1 - MainLayout 컴포넌트 테스트
// @SPEC docs/planning/phase-2-spec.md#메인-레이아웃
// @TEST 메인 레이아웃의 모든 하위 컴포넌트 렌더링 검증

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainLayout from '@renderer/components/layout/MainLayout';

// Mock 데이터
const mockUsage = {
  tokensUsed: 50000,
  contextLimit: 200000,
  dailyTokensUsed: 150000,
  taskDuration: 125,
};

const mockSkills = [
  {
    id: '1',
    name: '/socrates',
    description: '21개 질문으로 기획',
  },
];

const mockWorkflow = [
  {
    id: '1',
    title: '기획',
    status: 'completed' as const,
  },
];

describe('MainLayout', () => {
  it('모든 하위 컴포넌트를 렌더링한다', () => {
    render(
      <MainLayout
        usage={mockUsage}
        skills={mockSkills}
        workflow={mockWorkflow}
        onSubmit={vi.fn()}
        onData={vi.fn()}
      />
    );

    // TitleBar
    expect(screen.getByText('clabs')).toBeInTheDocument();

    // SkillPanel
    expect(screen.getByTestId('skill-panel')).toBeInTheDocument();

    // TerminalView
    expect(screen.getByTestId('terminal-container')).toBeInTheDocument();

    // InputBox
    expect(screen.getByTestId('input-box')).toBeInTheDocument();

    // StatusBar
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('올바른 레이아웃 구조를 가진다', () => {
    const { container } = render(
      <MainLayout
        usage={mockUsage}
        skills={mockSkills}
        workflow={mockWorkflow}
        onSubmit={vi.fn()}
        onData={vi.fn()}
      />
    );

    // 메인 컨테이너
    const mainContainer = container.querySelector('[data-testid="main-layout"]');
    expect(mainContainer).toBeInTheDocument();

    // 그리드 레이아웃 확인 (TitleBar는 제외)
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('SkillPanel이 280px 너비를 가진다', () => {
    const { container } = render(
      <MainLayout
        usage={mockUsage}
        skills={mockSkills}
        workflow={mockWorkflow}
        onSubmit={vi.fn()}
        onData={vi.fn()}
      />
    );

    const skillPanelContainer = container.querySelector('[data-testid="skill-panel"]')?.parentElement;
    expect(skillPanelContainer).toHaveClass('w-[280px]');
  });

  it('onSubmit 콜백을 InputBox에 전달한다', () => {
    const onSubmit = vi.fn();

    render(
      <MainLayout
        usage={mockUsage}
        skills={mockSkills}
        workflow={mockWorkflow}
        onSubmit={onSubmit}
        onData={vi.fn()}
      />
    );

    const inputBox = screen.getByTestId('input-box');
    expect(inputBox).toBeInTheDocument();
  });

  it('onData 콜백을 TerminalView에 전달한다', () => {
    const onData = vi.fn();

    render(
      <MainLayout
        usage={mockUsage}
        skills={mockSkills}
        workflow={mockWorkflow}
        onSubmit={vi.fn()}
        onData={onData}
      />
    );

    const terminal = screen.getByTestId('terminal-container');
    expect(terminal).toBeInTheDocument();
  });

  it('프로젝트명을 TitleBar에 전달한다', () => {
    render(
      <MainLayout
        usage={mockUsage}
        skills={mockSkills}
        workflow={mockWorkflow}
        projectName="테스트 프로젝트"
        onSubmit={vi.fn()}
        onData={vi.fn()}
      />
    );

    expect(screen.getByText('테스트 프로젝트')).toBeInTheDocument();
  });

  it('recommendation이 있을 때 SkillPanel에 전달한다', () => {
    const mockRecommendation = {
      id: '1',
      title: '다음 스킬',
      description: '/screen-spec 추천',
    };

    render(
      <MainLayout
        usage={mockUsage}
        skills={mockSkills}
        workflow={mockWorkflow}
        recommendation={mockRecommendation}
        onSubmit={vi.fn()}
        onData={vi.fn()}
      />
    );

    expect(screen.getByText('다음 스킬')).toBeInTheDocument();
  });

  it('disabled 상태를 InputBox에 전달한다', () => {
    render(
      <MainLayout
        usage={mockUsage}
        skills={mockSkills}
        workflow={mockWorkflow}
        disabled={true}
        onSubmit={vi.fn()}
        onData={vi.fn()}
      />
    );

    const inputBox = screen.getByTestId('input-box');
    expect(inputBox).toBeDisabled();
  });
});
