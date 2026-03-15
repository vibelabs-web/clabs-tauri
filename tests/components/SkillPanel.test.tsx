// @TASK P2-S3-T1 - SkillPanel 컴포넌트 테스트
// @SPEC Worktree Phase 2 - 워크플로우, 추천, 스킬 버튼 표시 패널

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillPanel } from '../../src/renderer/components/layout/SkillPanel';
import type { Skill, WorkflowStep, Recommendation } from '../../src/renderer/types/skill-panel';

describe('SkillPanel', () => {
  const mockSkills = [
    { id: '1', name: '/socrates', description: '21개 질문으로 기획' },
    { id: '2', name: '/screen-spec', description: '화면 명세 생성' },
    { id: '3', name: '/auto-orchestrate', description: '자동 개발' },
  ];

  const mockWorkflow = [
    { id: '1', title: '기획', status: 'completed' as const },
    { id: '2', title: '설계', status: 'active' as const },
    { id: '3', title: '개발', status: 'pending' as const },
  ];

  const mockRecommendation = {
    id: '1',
    title: '화면 명세 생성 권장',
    description: '기획 단계가 완료되었습니다. 다음은 화면 명세를 생성하세요.',
    suggestedSkill: '/screen-spec',
  };

  describe('Rendering', () => {
    it('should render SkillPanel component', () => {
      render(<SkillPanel skills={mockSkills} workflow={mockWorkflow} />);
      expect(screen.getByTestId('skill-panel')).toBeInTheDocument();
    });

    it('should render workflow steps', () => {
      render(<SkillPanel skills={mockSkills} workflow={mockWorkflow} />);
      expect(screen.getByText('기획')).toBeInTheDocument();
      expect(screen.getByText('설계')).toBeInTheDocument();
      expect(screen.getByText('개발')).toBeInTheDocument();
    });

    it('should render skill buttons', () => {
      render(<SkillPanel skills={mockSkills} workflow={mockWorkflow} />);
      expect(screen.getByText('/socrates')).toBeInTheDocument();
      expect(screen.getByText('/screen-spec')).toBeInTheDocument();
      expect(screen.getByText('/auto-orchestrate')).toBeInTheDocument();
    });

    it('should render recommendation when provided', () => {
      render(
        <SkillPanel
          skills={mockSkills}
          workflow={mockWorkflow}
          recommendation={mockRecommendation}
        />
      );
      expect(screen.getByText('화면 명세 생성 권장')).toBeInTheDocument();
      expect(
        screen.getByText(
          '기획 단계가 완료되었습니다. 다음은 화면 명세를 생성하세요.'
        )
      ).toBeInTheDocument();
    });

    it('should not render recommendation section when not provided', () => {
      render(<SkillPanel skills={mockSkills} workflow={mockWorkflow} />);
      expect(screen.queryByText('화면 명세 생성 권장')).not.toBeInTheDocument();
    });
  });

  describe('Workflow Status', () => {
    it('should display completed status correctly', () => {
      render(<SkillPanel skills={mockSkills} workflow={mockWorkflow} />);
      const completedStep = screen.getByText('기획').closest('[data-status]');
      expect(completedStep).toHaveAttribute('data-status', 'completed');
    });

    it('should display active status correctly', () => {
      render(<SkillPanel skills={mockSkills} workflow={mockWorkflow} />);
      const activeStep = screen.getByText('설계').closest('[data-status]');
      expect(activeStep).toHaveAttribute('data-status', 'active');
    });

    it('should display pending status correctly', () => {
      render(<SkillPanel skills={mockSkills} workflow={mockWorkflow} />);
      const pendingStep = screen.getByText('개발').closest('[data-status]');
      expect(pendingStep).toHaveAttribute('data-status', 'pending');
    });
  });

  describe('Empty States', () => {
    it('should render empty state when no skills provided', () => {
      render(<SkillPanel skills={[]} workflow={mockWorkflow} />);
      expect(screen.getByText('사용 가능한 스킬이 없습니다')).toBeInTheDocument();
    });

    it('should render empty state when no workflow provided', () => {
      render(<SkillPanel skills={mockSkills} workflow={[]} />);
      expect(screen.getByText('워크플로우가 없습니다')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SkillPanel skills={mockSkills} workflow={mockWorkflow} />);
      expect(screen.getByLabelText('워크플로우 진행 상황')).toBeInTheDocument();
      expect(screen.getByLabelText('스킬 목록')).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      render(<SkillPanel skills={mockSkills} workflow={mockWorkflow} />);
      const regions = screen.getAllByRole('region');
      expect(regions.length).toBeGreaterThan(0);
    });
  });
});
