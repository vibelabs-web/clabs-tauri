// Claude Code CLI 공유 상수 및 타입 정의
// SkillPanel, InputBox, CommandBuilder 등에서 공유

// ─────────────────────────────────────────────────────────────
// 인터페이스 정의
// ─────────────────────────────────────────────────────────────

export interface BuiltinCommand {
  command: string;
  description: string;
}

export interface CLIFlag {
  flag: string;
  alias?: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'enum';
  enumValues?: string[];
  defaultValue?: string | number | boolean;
  category: 'basic' | 'session' | 'output' | 'security' | 'advanced';
}

export interface QuickAction {
  command: string;
  label: string;
  description: string;
  icon: 'rocket' | 'terminal' | 'bug' | 'gear';
  category: 'basic' | 'development' | 'debugging' | 'automation';
}

export interface CommandHistoryEntry {
  command: string;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────
// Claude Code 빌트인 명령어 (19개 — 두 파일 합집합)
// ─────────────────────────────────────────────────────────────

export const BUILTIN_COMMANDS: BuiltinCommand[] = [
  { command: '/clear', description: '대화 기록 초기화' },
  { command: '/compact', description: '컨텍스트 압축' },
  { command: '/config', description: '설정 보기/변경' },
  { command: '/cost', description: '비용 정보 표시' },
  { command: '/doctor', description: '설정 진단' },
  { command: '/help', description: '도움말 표시' },
  { command: '/init', description: 'CLAUDE.md 초기화' },
  { command: '/login', description: '로그인' },
  { command: '/logout', description: '로그아웃' },
  { command: '/mcp', description: 'MCP 서버 관리' },
  { command: '/memory', description: '메모리 관리' },
  { command: '/model', description: '모델 선택' },
  { command: '/permissions', description: '권한 설정' },
  { command: '/pr_comments', description: 'PR 코멘트 보기' },
  { command: '/resume', description: '이전 대화 재개' },
  { command: '/review', description: '코드 리뷰' },
  { command: '/status', description: '상태 표시' },
  { command: '/terminal-setup', description: '터미널 설정' },
  { command: '/vim', description: 'Vim 모드 설정' },
];

// ─────────────────────────────────────────────────────────────
// Claude Code 번들 스킬 (5개 — 프롬프트 기반, 모든 세션에서 사용 가능)
// ─────────────────────────────────────────────────────────────

export interface BundledSkill {
  command: string;
  label: string;
  description: string;
  detail: string;
}

export const BUNDLED_SKILLS: BundledSkill[] = [
  {
    command: '/simplify',
    label: 'Simplify',
    description: '변경 파일 코드 리뷰 + 자동 수정',
    detail: '3개 병렬 에이전트(재사용·품질·효율성)로 검토 후 수정 적용. /simplify focus on memory efficiency',
  },
  {
    command: '/batch',
    label: 'Batch',
    description: '대규모 병렬 변경 조율',
    detail: '코드베이스 조사 → 5~30개 단위 분해 → 격리된 worktree에서 병렬 구현 → PR 생성. Git 필요.',
  },
  {
    command: '/debug',
    label: 'Debug',
    description: '세션 디버그 로그 분석',
    detail: '현재 Claude Code 세션의 디버그 로그를 읽어 문제를 진단합니다.',
  },
  {
    command: '/loop',
    label: 'Loop',
    description: '프롬프트 반복 실행 (cron)',
    detail: '세션 열림 동안 간격에 따라 프롬프트를 반복. /loop 5m check if the deploy finished',
  },
  {
    command: '/claude-api',
    label: 'Claude API',
    description: 'Claude API/SDK 참조 자료 로드',
    detail: '프로젝트 언어별 API 참조 + Agent SDK. 도구 사용, 스트리밍, 배치, 구조화된 출력 가이드.',
  },
];

// ─────────────────────────────────────────────────────────────
// CLI 플래그 (15개 — basic/session/output/security/advanced)
// ─────────────────────────────────────────────────────────────

export const CLI_FLAGS: CLIFlag[] = [
  // basic
  { flag: '--help', alias: '-h', description: '도움말 표시', type: 'boolean', category: 'basic' },
  { flag: '--version', alias: '-v', description: '버전 표시', type: 'boolean', category: 'basic' },
  { flag: '--print', alias: '-p', description: '비대화형 모드 (결과만 출력)', type: 'boolean', category: 'basic' },
  // session
  { flag: '--resume', alias: '-r', description: '이전 대화 재개', type: 'boolean', category: 'session' },
  { flag: '--continue', alias: '-c', description: '가장 최근 대화 계속', type: 'boolean', category: 'session' },
  { flag: '--model', description: '사용할 모델 지정', type: 'string', category: 'session' },
  // output
  { flag: '--output-format', description: '출력 형식 선택', type: 'enum', enumValues: ['text', 'json', 'stream-json'], category: 'output' },
  { flag: '--verbose', description: '상세 로그 출력', type: 'boolean', category: 'output' },
  // security
  { flag: '--dangerously-skip-permissions', description: '권한 확인 건너뛰기', type: 'boolean', category: 'security' },
  { flag: '--allowedTools', description: '허용할 도구 목록 (쉼표 구분)', type: 'string', category: 'security' },
  // advanced
  { flag: '--max-turns', description: '최대 턴 수 제한', type: 'number', category: 'advanced' },
  { flag: '--max-cost', description: '최대 비용 제한 ($)', type: 'number', category: 'advanced' },
  { flag: '--system-prompt', description: '시스템 프롬프트 설정', type: 'string', category: 'advanced' },
  { flag: '--append-system-prompt', description: '시스템 프롬프트 추가', type: 'string', category: 'advanced' },
  { flag: '--permission-mode', description: '권한 모드 선택', type: 'enum', enumValues: ['default', 'plan', 'bypassPermissions'], category: 'advanced' },
];

// ─────────────────────────────────────────────────────────────
// 퀵 액션 프리셋 (10개 — 기본/개발/디버깅/자동화)
// ─────────────────────────────────────────────────────────────

export const QUICK_ACTIONS: QuickAction[] = [
  // 기본
  { command: 'claude', label: 'Claude 시작', description: '기본 모드로 Claude 실행', icon: 'rocket', category: 'basic' },
  { command: 'claude --dangerously-skip-permissions', label: 'Claude 기본', description: '권한 확인 없이 Claude 실행', icon: 'rocket', category: 'basic' },
  { command: 'claude --continue', label: '대화 계속', description: '가장 최근 대화 이어하기', icon: 'terminal', category: 'basic' },
  // 개발
  { command: 'claude --model opus --dangerously-skip-permissions', label: 'Opus 모드', description: 'Opus 모델로 실행', icon: 'rocket', category: 'development' },
  { command: 'claude --dangerously-skip-permissions --verbose', label: '워크트리 모드', description: '상세 로그와 함께 실행', icon: 'terminal', category: 'development' },
  { command: 'claude -p "이 프로젝트의 구조를 분석해줘"', label: '프로젝트 분석', description: '프로젝트 구조 분석 (비대화형)', icon: 'terminal', category: 'development' },
  // 디버깅
  { command: 'claude --verbose', label: '상세 모드', description: '디버그 로그 활성화', icon: 'bug', category: 'debugging' },
  { command: 'claude /doctor', label: '인증 상태', description: 'Claude 설정 진단', icon: 'gear', category: 'debugging' },
  // 자동화
  { command: 'claude --dangerously-skip-permissions --max-turns 10', label: '턴 제한 실행', description: '10턴 제한으로 자동 실행', icon: 'gear', category: 'automation' },
  { command: 'claude --dangerously-skip-permissions --max-cost 5', label: '비용 제한 실행', description: '$5 비용 제한으로 실행', icon: 'gear', category: 'automation' },
];

// ─────────────────────────────────────────────────────────────
// 카테고리 레이블
// ─────────────────────────────────────────────────────────────

export const QUICK_ACTION_CATEGORIES: Record<QuickAction['category'], string> = {
  basic: '기본',
  development: '개발',
  debugging: '디버깅',
  automation: '자동화',
};

export const CLI_FLAG_CATEGORIES: Record<CLIFlag['category'], string> = {
  basic: '기본',
  session: '세션',
  output: '출력',
  security: '보안',
  advanced: '고급',
};
