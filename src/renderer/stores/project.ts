// @TASK Project Store - 프로젝트 상태 관리
// 프로젝트 선택, 변경, PTY 재시작 관리

import { create } from 'zustand';
import type { Project } from '@shared/types';

interface ProjectState {
  // 현재 프로젝트
  currentProject: Project | null;
  recentProjects: Project[];

  // 프로젝트 선택 모달 상태
  showProjectSelector: boolean;

  // 로딩 상태
  isLoading: boolean;

  // 액션
  setCurrentProject: (project: Project | null) => void;
  selectProject: (path: string) => Promise<void>;
  changeProject: (path: string) => Promise<void>;
  openProjectSelector: () => void;
  closeProjectSelector: () => void;
  loadRecentProjects: () => Promise<void>;
  removeRecentProject: (path: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  recentProjects: [],
  showProjectSelector: true, // 앱 시작 시 모달 표시
  isLoading: false,

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  selectProject: async (path: string) => {
    const { currentProject } = get();

    // 같은 프로젝트 선택 시 모달만 닫기
    if (currentProject && currentProject.path === path) {
      set({ showProjectSelector: false });
      return;
    }

    set({ isLoading: true });

    try {
      if (window.api?.projects?.add) {
        const project = await window.api.projects.add(path);
        set({
          currentProject: project,
          showProjectSelector: false,
          isLoading: false,
        });

        // 최근 프로젝트 목록 새로고침
        get().loadRecentProjects();
      }
    } catch (error) {
      console.error('프로젝트 선택 실패:', error);
      set({ isLoading: false });
    }
  },

  changeProject: async (path: string) => {
    set({ isLoading: true });

    try {
      // 1. 기존 PTY 종료
      if (window.api?.pty?.kill) {
        window.api.pty.kill();
      }

      // 2. 프로젝트 저장 및 선택
      if (window.api?.projects?.add) {
        const project = await window.api.projects.add(path);
        set({
          currentProject: project,
          showProjectSelector: false,
        });

        // 3. 최근 프로젝트 목록 새로고침
        get().loadRecentProjects();
      }

      set({ isLoading: false });

      // PTY는 MainPage에서 다시 시작됨 (onTerminalReady)
    } catch (error) {
      console.error('프로젝트 변경 실패:', error);
      set({ isLoading: false });
    }
  },

  openProjectSelector: () => {
    set({ showProjectSelector: true });
  },

  closeProjectSelector: () => {
    set({ showProjectSelector: false });
  },

  loadRecentProjects: async () => {
    try {
      if (window.api?.projects?.list) {
        const projects = await window.api.projects.list();
        set({ recentProjects: projects });
      }
    } catch (error) {
      console.error('최근 프로젝트 로드 실패:', error);
    }
  },

  removeRecentProject: async (path: string) => {
    try {
      if (window.api?.projects?.remove) {
        await window.api.projects.remove(path);
        get().loadRecentProjects();
      }
    } catch (error) {
      console.error('프로젝트 제거 실패:', error);
    }
  },
}));
