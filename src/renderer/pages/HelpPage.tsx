import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type HelpTab = 'skills' | 'workflow' | 'shortcuts' | 'faq';

export default function HelpPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HelpTab>('skills');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: HelpTab; label: string }[] = [
    { id: 'skills', label: '스킬 목록' },
    { id: 'workflow', label: '워크플로우' },
    { id: 'shortcuts', label: '단축키' },
    { id: 'faq', label: 'FAQ' },
  ];

  const skills = [
    { command: '/socrates', category: '기획', description: '소크라테스식 1:1 기획 컨설팅' },
    { command: '/screen-spec', category: '기획', description: '화면별 상세 명세 생성' },
    { command: '/tasks-generator', category: '기획', description: 'TASKS.md 태스크 생성' },
    { command: '/auto-orchestrate', category: '구현', description: '자동 태스크 실행' },
    { command: '/code-review', category: '검증', description: '코드 리뷰 수행' },
    { command: '/trinity', category: '검증', description: '코드 품질 점수 측정' },
    { command: '/memory', category: '유틸', description: '세션 간 학습 저장' },
    { command: '/deep-research', category: '유틸', description: '심층 리서치 수행' },
  ];

  const shortcuts = [
    { key: 'Enter', description: '메시지 전송' },
    { key: 'Shift + Enter', description: '줄바꿈' },
    { key: 'Ctrl/Cmd + K', description: '스킬 검색' },
    { key: 'Ctrl/Cmd + ,', description: '설정 열기' },
    { key: 'Ctrl/Cmd + N', description: '새 세션' },
    { key: 'Esc', description: '선택 모드 취소' },
  ];

  const faqs = [
    {
      question: '라이선스는 어떻게 갱신하나요?',
      answer: '라이선스는 일회성 구매이며, 6개월간 무료 업그레이드가 포함됩니다.',
    },
    {
      question: '한글 입력이 안돼요',
      answer: '하단 입력창에서 한글을 입력하세요. 터미널에서는 방향키와 선택만 가능합니다.',
    },
    {
      question: '스킬팩을 어떻게 업데이트하나요?',
      answer: '설정 > 스킬팩에서 자동 업데이트를 활성화하거나, 수동으로 업데이트할 수 있습니다.',
    },
  ];

  const filteredSkills = skills.filter(
    (skill) =>
      skill.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.includes(searchQuery)
  );

  return (
    <div className="h-full flex flex-col">
      {/* 타이틀바 */}
      <header className="h-10 bg-bg-secondary border-b border-bg-tertiary drag-region flex items-center px-4">
        <button
          onClick={() => navigate(-1)}
          className="no-drag text-text-muted hover:text-text-primary mr-4"
        >
          ← 뒤로
        </button>
        <span className="text-sm font-medium">도움말</span>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 사이드바 탭 */}
        <aside className="w-48 bg-bg-secondary border-r border-bg-tertiary p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-3 py-2 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* 콘텐츠 */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">스킬 목록</h2>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="스킬 검색..."
                  className="px-3 py-1.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-2">
                {filteredSkills.map((skill) => (
                  <div
                    key={skill.command}
                    className="p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <code className="text-accent font-mono">{skill.command}</code>
                      <span className="text-xs px-2 py-0.5 bg-bg-tertiary rounded text-text-muted">
                        {skill.category}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted mt-1">{skill.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">권장 워크플로우</h2>

              <div className="p-4 bg-bg-secondary rounded-lg">
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-2 py-1 bg-accent/20 text-accent rounded">/socrates</span>
                  <span className="text-text-muted">→</span>
                  <span className="px-2 py-1 bg-bg-tertiary rounded">/screen-spec</span>
                  <span className="text-text-muted">→</span>
                  <span className="px-2 py-1 bg-bg-tertiary rounded">/tasks-generator</span>
                  <span className="text-text-muted">→</span>
                  <span className="px-2 py-1 bg-bg-tertiary rounded">/project-bootstrap</span>
                  <span className="text-text-muted">→</span>
                  <span className="px-2 py-1 bg-bg-tertiary rounded">/auto-orchestrate</span>
                </div>
              </div>

              <div className="space-y-4 text-sm text-text-muted">
                <p><strong className="text-text-primary">1. /socrates</strong> - 소크라테스식 질문으로 핵심 기능 도출</p>
                <p><strong className="text-text-primary">2. /screen-spec</strong> - 화면별 상세 명세 YAML 생성</p>
                <p><strong className="text-text-primary">3. /tasks-generator</strong> - 개발 태스크 TASKS.md 생성</p>
                <p><strong className="text-text-primary">4. /project-bootstrap</strong> - 프로젝트 환경 셋업</p>
                <p><strong className="text-text-primary">5. /auto-orchestrate</strong> - 자동 태스크 실행</p>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">단축키</h2>

              <div className="space-y-2">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                  >
                    <span className="text-text-muted">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-bg-tertiary rounded font-mono text-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">자주 묻는 질문</h2>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-4 bg-bg-secondary rounded-lg">
                    <h3 className="font-medium mb-2">{faq.question}</h3>
                    <p className="text-sm text-text-muted">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
