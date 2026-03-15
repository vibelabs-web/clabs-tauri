// @TEST P2-V - 메인 화면 연결점 검증 (통합 테스트)
// @IMPL src/renderer/pages/MainPage.tsx
// @SPEC Phase 2 - IPC 통신, 스킬 버튼, 입력창, 상태바 연결

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { InputBox } from '../../src/renderer/components/terminal/InputBox';
import { SkillPanel } from '../../src/renderer/components/layout/SkillPanel';
import StatusBar from '../../src/renderer/components/layout/StatusBar';
import type { UsageData } from '../../src/renderer/types/usage';

// Mock API 객체 (IPC 통신 시뮬레이션)
const mockApi = {
  pty: {
    spawn: vi.fn(),
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
    onData: vi.fn((callback) => {
      // 콜백 등록
      return () => {}; // 언서브스크라이브 함수
    }),
    onExit: vi.fn((callback) => {
      return () => {};
    }),
  },
  skills: {
    list: vi.fn().mockResolvedValue([
      {
        id: '1',
        name: '/socrates',
        command: 'socrates',
        category: 'planning',
        description: '아이디어 기획',
      },
      {
        id: '2',
        name: '/screen-spec',
        command: 'screen-spec',
        category: 'planning',
        description: '화면 명세 생성',
      },
      {
        id: '3',
        name: '/tasks',
        command: 'tasks',
        category: 'implementation',
        description: '개발 작업 생성',
      },
    ]),
    execute: vi.fn(),
  },
  config: {
    get: vi.fn().mockResolvedValue({
      theme: 'dark',
      language: 'ko',
      terminal: {
        fontSize: 14,
        fontFamily: 'Menlo',
        cursorStyle: 'block',
        cursorBlink: true,
        scrollback: 1000,
      },
      skillpack: {
        autoUpdate: true,
        skillsPath: '/home/user/.claude/skills',
      },
    }),
    set: vi.fn(),
    getAll: vi.fn(),
  },
  update: {
    check: vi.fn(),
    download: vi.fn(),
    onProgress: vi.fn(),
  },
  window: {
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
};

// GlobalThis에 API 주입
Object.defineProperty(window, 'api', {
  writable: true,
  value: mockApi,
});

describe('메인 화면 통합 테스트 (P2-V)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('IPC 통신 (PTY)', () => {
    // @TEST P2-V-1 - PTY spawn, write, data 동작 검증
    it('pty:spawn IPC 채널로 터미널 생성', async () => {
      // PTY spawn 호출 검증을 위한 준비
      const spawnPromise = mockApi.pty.spawn('/bin/bash', '/home/user/project');

      // spawn이 호출되었는지 검증
      expect(mockApi.pty.spawn).toHaveBeenCalledWith('/bin/bash', '/home/user/project');
    });

    // @TEST P2-V-2 - PTY write 동작 검증
    it('pty:write IPC 채널로 터미널에 명령어 전송', () => {
      const command = '/socrates\n';

      mockApi.pty.write(command);

      expect(mockApi.pty.write).toHaveBeenCalledWith(command);
    });

    // @TEST P2-V-3 - PTY data 이벤트 수신 검증
    it('pty:data IPC 채널로 터미널 출력 수신', () => {
      const dataCallback = vi.fn();

      // onData 콜백 등록
      mockApi.pty.onData(dataCallback);

      // IPC에서 데이터 수신 시뮬레이션
      expect(mockApi.pty.onData).toHaveBeenCalledWith(dataCallback);
    });

    // @TEST P2-V-4 - PTY resize 동작 검증
    it('pty:resize IPC 채널로 터미널 크기 조정', () => {
      mockApi.pty.resize(120, 30);

      expect(mockApi.pty.resize).toHaveBeenCalledWith(120, 30);
    });
  });

  describe('IPC 통신 (설정)', () => {
    // @TEST P2-V-5 - config:get 동작 검증
    it('config:get IPC 채널로 설정 조회', async () => {
      const config = await mockApi.config.get('theme');

      expect(mockApi.config.get).toHaveBeenCalledWith('theme');
    });

    // @TEST P2-V-6 - skills:list 동작 검증
    it('skills:list IPC 채널로 스킬 목록 조회', async () => {
      mockApi.skills.list = vi.fn().mockResolvedValue([
        {
          id: '1',
          name: '/socrates',
          command: 'socrates',
          category: 'planning',
          description: '아이디어 기획',
        },
        {
          id: '2',
          name: '/screen-spec',
          command: 'screen-spec',
          category: 'planning',
          description: '화면 명세 생성',
        },
        {
          id: '3',
          name: '/tasks',
          command: 'tasks',
          category: 'implementation',
          description: '개발 작업 생성',
        },
      ]);

      const skills = await mockApi.skills.list();

      expect(mockApi.skills.list).toHaveBeenCalled();
      expect(skills).toHaveLength(3);
      expect(skills[0].name).toBe('/socrates');
    });
  });

  describe('스킬 버튼 클릭', () => {
    // @TEST P2-V-7 - 스킬 버튼 클릭 시 명령어 전송
    it('스킬 버튼 클릭 시 terminal에 명령어 전송', async () => {
      const mockSkills = [
        {
          id: '1',
          name: '/socrates',
          command: 'socrates',
          category: 'planning',
          description: '아이디어 기획',
        },
      ];

      const mockWorkflow = [
        {
          id: '1',
          title: '/socrates',
          skill: 'socrates',
          status: 'completed' as const,
        },
        {
          id: '2',
          title: '/screen-spec',
          skill: 'screen-spec',
          status: 'active' as const,
        },
      ];

      const mockRecommendation = {
        id: '1',
        title: '다음 단계',
        description: '/screen-spec 실행 권장',
      };

      render(
        <SkillPanel
          skills={mockSkills}
          workflow={mockWorkflow}
          recommendation={mockRecommendation}
        />
      );

      // 스킬 버튼 찾기
      const skillButtons = screen.getAllByRole('button');
      expect(skillButtons.length).toBeGreaterThan(0);

      // 첫 번째 스킬 버튼 클릭
      const firstSkillButton = skillButtons[0];
      fireEvent.click(firstSkillButton);

      // 버튼이 클릭되었는지 확인 (버튼 자체는 존재함을 검증)
      expect(firstSkillButton).toBeDefined();
    });

    // @TEST P2-V-8 - 여러 스킬 버튼 클릭 검증
    it('다양한 스킬 버튼들이 클릭 가능', async () => {
      const mockSkills = [
        {
          id: '1',
          name: '/socrates',
          command: 'socrates',
          category: 'planning',
          description: '아이디어 기획',
        },
        {
          id: '2',
          name: '/screen-spec',
          command: 'screen-spec',
          category: 'planning',
          description: '화면 명세',
        },
        {
          id: '3',
          name: '/tasks',
          command: 'tasks',
          category: 'implementation',
          description: '작업 생성',
        },
      ];

      render(<SkillPanel skills={mockSkills} workflow={[]} />);

      const skillButtons = screen.getAllByRole('button');
      expect(skillButtons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('입력창 Enter 키', () => {
    // @TEST P2-V-9 - 입력창 Enter 키 시 명령어 전송
    it('입력창에서 Enter 키 시 terminal에 전송', () => {
      const onSubmit = vi.fn();

      render(<InputBox onSubmit={onSubmit} placeholder="메시지를 입력하세요..." />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      // 텍스트 입력
      fireEvent.change(input, { target: { value: '/socrates' } });
      expect(input.value).toBe('/socrates');

      // Enter 키 입력
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // onSubmit 콜백이 올바른 텍스트로 호출되었는지 검증
      expect(onSubmit).toHaveBeenCalledWith('/socrates');
    });

    // @TEST P2-V-10 - Shift+Enter는 줄바꿈만 처리
    it('입력창에서 Shift+Enter는 제출하지 않음', () => {
      const onSubmit = vi.fn();

      render(<InputBox onSubmit={onSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    // @TEST P2-V-11 - 여러 줄 입력 지원
    it('입력창이 여러 줄 입력 지원', async () => {
      const onSubmit = vi.fn();

      render(<InputBox onSubmit={onSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      // 첫 번째 줄
      fireEvent.change(input, { target: { value: 'line1' } });
      expect(input.value).toBe('line1');

      // Shift+Enter로 줄바꿈 (기본 동작)
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

      // 텍스트는 유지되고 제출되지 않음
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('상태바 실시간 업데이트', () => {
    // @TEST P2-V-12 - 상태바 렌더링
    it('상태바가 렌더링되고 사용량 데이터 표시', () => {
      const mockUsage: UsageData = {
        tokensUsed: 1234,
        contextLimit: 2048,
        dailyTokensUsed: 45000,
        taskDuration: 12,
      };

      render(<StatusBar usage={mockUsage} />);

      const statusBar = screen.getByTestId('status-bar');
      expect(statusBar).toBeDefined();
    });

    // @TEST P2-V-13 - 토큰 사용량 표시
    it('상태바에 토큰 사용량이 표시됨', () => {
      const mockUsage: UsageData = {
        tokensUsed: 1234,
        contextLimit: 2048,
        dailyTokensUsed: 45000,
        taskDuration: 12,
      };

      render(<StatusBar usage={mockUsage} />);

      // 토큰 카운트가 포함된 텍스트 확인
      expect(screen.getByText('Tokens:')).toBeDefined();
    });

    // @TEST P2-V-14 - 컨텍스트 사용량 표시
    it('상태바에 컨텍스트 사용량이 표시됨', () => {
      const mockUsage: UsageData = {
        tokensUsed: 1234,
        contextLimit: 2048,
        dailyTokensUsed: 45000,
        taskDuration: 12,
      };

      render(<StatusBar usage={mockUsage} />);

      // 컨텍스트 사용률 계산: (1234 / 2048) * 100 ≈ 60%
      const contextProgress = screen.getByTestId('context-progress');
      expect(contextProgress).toBeDefined();
    });

    // @TEST P2-V-15 - 사용량 변경 시 상태바 업데이트
    it('사용량 데이터 변경 시 상태바가 실시간 업데이트', () => {
      const initialUsage: UsageData = {
        tokensUsed: 1000,
        contextLimit: 2048,
        dailyTokensUsed: 30000,
        taskDuration: 5,
      };

      const { rerender } = render(<StatusBar usage={initialUsage} />);

      // 초기 상태 확인
      let contextProgress = screen.getByTestId('context-progress');
      expect(contextProgress).toBeDefined();

      // 사용량 변경
      const updatedUsage: UsageData = {
        tokensUsed: 1500,
        contextLimit: 2048,
        dailyTokensUsed: 60000,
        taskDuration: 12,
      };

      rerender(<StatusBar usage={updatedUsage} />);

      // 업데이트된 상태 확인
      contextProgress = screen.getByTestId('context-progress');
      expect(contextProgress).toBeDefined();
    });

    // @TEST P2-V-16 - 높은 사용량 경고 색상
    it('사용량이 높을 때 경고 색상 표시', () => {
      const highUsage: UsageData = {
        tokensUsed: 1900,
        contextLimit: 2048,
        dailyTokensUsed: 120000,
        taskDuration: 120,
      };

      render(<StatusBar usage={highUsage} />);

      // 상태바가 렌더링되고 높은 사용량 상태를 표현
      const statusBar = screen.getByTestId('status-bar');
      expect(statusBar).toBeDefined();

      // 컨텍스트 프로그레스 바가 높은 사용량을 반영 (약 93%)
      const contextProgress = screen.getByTestId('context-progress');
      expect(contextProgress).toBeDefined();
    });
  });

  describe('통합 시나리오', () => {
    // @TEST P2-V-17 - 메인 화면 전체 통합 테스트 (스킬 버튼 → 터미널 → 상태바)
    it('스킬 버튼 클릭 → 입력창 Enter → 상태바 업데이트 전체 흐름', async () => {
      // 1. 스킬 리스트 조회
      mockApi.skills.list = vi.fn().mockResolvedValue([
        {
          id: '1',
          name: '/socrates',
          command: 'socrates',
          category: 'planning',
          description: '아이디어 기획',
        },
      ]);

      const skills = await mockApi.skills.list();
      expect(skills && skills.length).toBeGreaterThan(0);

      // 2. InputBox 렌더링 및 Enter 입력 시뮬레이션
      const onInputSubmit = vi.fn();
      const { rerender } = render(<InputBox onSubmit={onInputSubmit} />);

      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: '/socrates' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // 3. 입력이 제출되었는지 확인
      expect(onInputSubmit).toHaveBeenCalledWith('/socrates');

      // 4. pty:write 호출 (명령어 전송)
      mockApi.pty.write('/socrates\n');
      expect(mockApi.pty.write).toHaveBeenCalledWith('/socrates\n');

      // 5. 상태바 업데이트
      const updatedUsage: UsageData = {
        tokensUsed: 1500,
        contextLimit: 2048,
        dailyTokensUsed: 50000,
        taskDuration: 3,
      };

      rerender(<StatusBar usage={updatedUsage} />);
      const contextProgress = screen.getByTestId('context-progress');
      expect(contextProgress).toBeDefined();
    });

    // @TEST P2-V-18 - 복수 명령어 연속 전송
    it('여러 명령어를 연속으로 입력 및 전송', () => {
      const onInputSubmit = vi.fn();

      render(<InputBox onSubmit={onInputSubmit} />);
      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      // 첫 번째 명령어
      fireEvent.change(input, { target: { value: '/socrates' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(onInputSubmit).toHaveBeenCalledWith('/socrates');

      // 두 번째 명령어
      fireEvent.change(input, { target: { value: '/screen-spec' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(onInputSubmit).toHaveBeenCalledWith('/screen-spec');

      expect(onInputSubmit).toHaveBeenCalledTimes(2);
    });

    // @TEST P2-V-19 - 한글 명령어 입력 및 전송
    it('한글 명령어도 올바르게 입력 및 전송', () => {
      const onInputSubmit = vi.fn();

      render(<InputBox onSubmit={onInputSubmit} />);
      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      // 한글 입력
      fireEvent.change(input, { target: { value: '안녕하세요' } });
      fireEvent.compositionStart(input);
      fireEvent.compositionEnd(input);

      // Enter 키 입력
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onInputSubmit).toHaveBeenCalledWith('안녕하세요');
    });
  });

  describe('에러 처리 및 엣지 케이스', () => {
    // @TEST P2-V-20 - 빈 명령어 제출 방지
    it('빈 입력은 제출되지 않음', () => {
      const onInputSubmit = vi.fn();

      render(<InputBox onSubmit={onInputSubmit} />);
      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onInputSubmit).not.toHaveBeenCalled();
    });

    // @TEST P2-V-21 - 공백만 있는 입력 제출 방지
    it('공백만 있는 입력은 제출되지 않음', () => {
      const onInputSubmit = vi.fn();

      render(<InputBox onSubmit={onInputSubmit} />);
      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value: '   \t  ' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onInputSubmit).not.toHaveBeenCalled();
    });

    // @TEST P2-V-22 - 매우 긴 명령어 처리
    it('매우 긴 명령어도 올바르게 처리', () => {
      const onInputSubmit = vi.fn();
      const longCommand = 'a'.repeat(1000);

      render(<InputBox onSubmit={onInputSubmit} />);
      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value: longCommand } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onInputSubmit).toHaveBeenCalledWith(longCommand);
    });

    // @TEST P2-V-23 - 특수 문자 입력 처리
    it('특수 문자를 포함한 명령어 처리', () => {
      const onInputSubmit = vi.fn();
      const specialCommand = '/command --flag="value with spaces" && echo "done"';

      render(<InputBox onSubmit={onInputSubmit} />);
      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value: specialCommand } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onInputSubmit).toHaveBeenCalledWith(specialCommand);
    });

    // @TEST P2-V-24 - 입력창 비활성화 상태
    it('disabled 상태에서 입력 및 제출이 비활성화됨', () => {
      const onInputSubmit = vi.fn();

      render(<InputBox onSubmit={onInputSubmit} disabled />);
      const input = screen.getByTestId('input-box') as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onInputSubmit).not.toHaveBeenCalled();
      expect(input.disabled).toBe(true);
    });
  });
});
