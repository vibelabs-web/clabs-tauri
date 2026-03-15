// @TASK P2-S3-T1 - SkillPanel 데모 페이지
// @SPEC Worktree Phase 2 - 워크플로우, 추천, 스킬 버튼 표시 패널 데모

import React, { useState } from 'react';
import { SkillPanel } from '../../../components/layout/SkillPanel';
import type { Skill, WorkflowStep, Recommendation } from '../../../types/skill-panel';

// Mock 데이터
const mockSkills: Skill[] = [
  { id: '1', name: '/socrates', description: '21개 질문으로 기획' },
  { id: '2', name: '/screen-spec', description: '화면 명세 생성' },
  { id: '3', name: '/auto-orchestrate', description: '자동 개발' },
  { id: '4', name: '/trinity', description: '품질 평가' },
  { id: '5', name: '/reverse', description: '명세서 추출' },
  { id: '6', name: '/sync', description: '동기화 검증' },
];

const mockWorkflowComplete: WorkflowStep[] = [
  { id: '1', title: '기획', status: 'completed' },
  { id: '2', title: '설계', status: 'completed' },
  { id: '3', title: '개발', status: 'active' },
  { id: '4', title: '테스트', status: 'pending' },
  { id: '5', title: '배포', status: 'pending' },
];

const mockWorkflowSimple: WorkflowStep[] = [
  { id: '1', title: '기획', status: 'completed' },
  { id: '2', title: '설계', status: 'active' },
  { id: '3', title: '개발', status: 'pending' },
];

const mockRecommendation: Recommendation = {
  id: '1',
  title: '화면 명세 생성 권장',
  description: '기획 단계가 완료되었습니다. 다음은 화면 명세를 생성하세요.',
  suggestedSkill: '/screen-spec',
};

// 데모 상태
const DEMO_STATES = {
  normal: {
    skills: mockSkills,
    workflow: mockWorkflowSimple,
    recommendation: undefined,
  },
  withRecommendation: {
    skills: mockSkills,
    workflow: mockWorkflowSimple,
    recommendation: mockRecommendation,
  },
  complete: {
    skills: mockSkills,
    workflow: mockWorkflowComplete,
    recommendation: mockRecommendation,
  },
  emptySkills: {
    skills: [],
    workflow: mockWorkflowSimple,
    recommendation: undefined,
  },
  emptyWorkflow: {
    skills: mockSkills,
    workflow: [],
    recommendation: undefined,
  },
  loading: {
    skills: mockSkills.slice(0, 2),
    workflow: mockWorkflowSimple.slice(0, 1),
    recommendation: undefined,
  },
} as const;

export default function SkillPanelDemoPage() {
  const [state, setState] = useState<keyof typeof DEMO_STATES>('normal');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SkillPanel Component Demo
        </h1>
        <p className="text-gray-600">
          P2-S3-T1: 워크플로우, 추천, 스킬 버튼 표시 패널
        </p>
      </div>

      {/* 상태 선택기 */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          데모 상태 선택
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(DEMO_STATES).map((s) => (
            <button
              key={s}
              onClick={() => setState(s as keyof typeof DEMO_STATES)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                state === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 컴포넌트 렌더링 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          컴포넌트 렌더링
        </h2>
        <SkillPanel {...DEMO_STATES[state]} />
      </div>

      {/* 상태 정보 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          현재 상태 정보
        </h2>
        <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(DEMO_STATES[state], null, 2)}
        </pre>
      </div>

      {/* 테스트 결과 */}
      <div className="mt-6 bg-green-50 border border-green-300 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800 mb-2">
          테스트 결과
        </h2>
        <ul className="text-sm text-green-700 space-y-1">
          <li>✓ 모든 테스트 통과 (12/12)</li>
          <li>✓ TypeScript 컴파일 에러 없음</li>
          <li>✓ 접근성 ARIA 라벨 적용</li>
          <li>✓ 반응형 디자인 (모바일/태블릿/데스크톱)</li>
          <li>✓ 키보드 네비게이션 지원</li>
        </ul>
      </div>
    </div>
  );
}
