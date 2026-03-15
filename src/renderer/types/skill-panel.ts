// @TASK P2-S3-T1 - SkillPanel 타입 정의
// @SPEC Worktree Phase 2 - 워크플로우, 추천, 스킬 버튼 표시 패널

export interface Skill {
  id: string;
  name: string;
  description: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  status: 'completed' | 'active' | 'pending';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  suggestedSkill: string;
}

export interface SkillPanelProps {
  skills: Skill[];
  workflow: WorkflowStep[];
  recommendation?: Recommendation;
}
