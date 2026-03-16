// 워크스페이스 탭 관리 Zustand 스토어
// 여러 프로젝트를 탭으로 열고, 탭 전환 시 기존 세션(PTY) 유지

import { create } from 'zustand';
import type { Project } from '@shared/types';
import type {
  PaneNode,
  PaneLeaf,
  PaneSplit,
  SplitDirection,
} from '@shared/pane-types';
import {
  getAllLeaves,
  findNode,
  findParent,
  replaceNode,
  generatePaneId,
} from '@shared/pane-types';
import type { EditorTab } from '@shared/pane-types';

const DEFAULT_PANE_ID_PREFIX = 'pane-default';

function createDefaultPaneId(tabId: string): string {
  return `${DEFAULT_PANE_ID_PREFIX}-${tabId}`;
}

function createDefaultRoot(tabId: string): PaneLeaf {
  return { type: 'leaf', id: createDefaultPaneId(tabId), name: 'Terminal' };
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface WorkspaceTab {
  id: string;
  project: Project;
  paneRoot: PaneNode;
  activePaneId: string;
  spawnedPaneIds: Set<string>;
}

interface WorkspaceState {
  tabs: WorkspaceTab[];
  activeTabId: string;

  // 탭 액션
  addTab: (project: Project) => string;
  removeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  getActiveTab: () => WorkspaceTab | null;

  // 탭 내 패인 조작
  splitPaneInTab: (tabId: string, paneId: string, direction: SplitDirection) => string | null;
  closePaneInTab: (tabId: string, paneId: string) => void;
  renamePaneInTab: (tabId: string, paneId: string, name: string) => void;
  resizeSplitInTab: (tabId: string, splitId: string, ratio: number) => void;
  setActivePaneInTab: (tabId: string, paneId: string) => void;
  markPaneSpawned: (tabId: string, paneId: string) => void;
  unmarkPaneSpawned: (tabId: string, paneId: string) => void;
  isPaneSpawned: (tabId: string, paneId: string) => boolean;
  getSpawnedPaneIds: (tabId: string) => Set<string>;
  clearSpawnedPanes: (tabId: string) => void;

  // 에디터 탭
  addEditorTab: (tabId: string, paneId: string, filePath: string) => void;
  switchEditorTab: (tabId: string, paneId: string, editorTabId: string) => void;
  closeEditorTab: (tabId: string, paneId: string, editorTabId: string) => void;
  setEditorTabDirty: (tabId: string, paneId: string, editorTabId: string, isDirty: boolean) => void;

  // 브로드캐스트 모드
  broadcastMode: boolean;
  toggleBroadcastMode: () => void;

  // 세션 저장/복원
  saveSession: () => Promise<void>;
  restoreSession: () => Promise<boolean>;

  // 유틸리티
  getTabByProject: (projectPath: string) => WorkspaceTab | null;
  getAllLeavesInTab: (tabId: string) => PaneLeaf[];
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  tabs: [],
  activeTabId: '',
  broadcastMode: false,

  addTab: (project: Project) => {
    const { tabs } = get();

    // 같은 프로젝트가 이미 열려 있으면 해당 탭으로 전환
    const existing = tabs.find(t => t.project.path === project.path);
    if (existing) {
      set({ activeTabId: existing.id });
      return existing.id;
    }

    const tabId = generateTabId();
    const defaultPaneId = createDefaultPaneId(tabId);
    const newTab: WorkspaceTab = {
      id: tabId,
      project,
      paneRoot: createDefaultRoot(tabId),
      activePaneId: defaultPaneId,
      spawnedPaneIds: new Set(),
    };

    set({
      tabs: [...tabs, newTab],
      activeTabId: tabId,
    });

    return tabId;
  },

  removeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    // 해당 탭의 모든 PTY 종료
    const tab = tabs[tabIndex];
    for (const paneId of tab.spawnedPaneIds) {
      window.api?.pty?.kill(paneId);
    }

    const newTabs = tabs.filter(t => t.id !== tabId);

    // 활성 탭이 닫히면 인접 탭으로 전환
    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      if (newTabs.length === 0) {
        newActiveTabId = '';
      } else {
        const newIndex = Math.min(tabIndex, newTabs.length - 1);
        newActiveTabId = newTabs[newIndex].id;
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveTabId });
  },

  switchTab: (tabId: string) => {
    const { tabs } = get();
    if (tabs.some(t => t.id === tabId)) {
      set({ activeTabId: tabId });
    }
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find(t => t.id === activeTabId) || null;
  },

  // --- 탭 내 패인 조작 (pane store 로직 재사용) ---

  splitPaneInTab: (tabId: string, paneId: string, direction: SplitDirection) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return null;

    const tab = tabs[tabIndex];
    const target = findNode(tab.paneRoot, paneId);
    if (!target || target.type !== 'leaf') return null;

    const newPaneId = generatePaneId();
    const newLeaf: PaneLeaf = {
      type: 'leaf',
      id: newPaneId,
      name: `Terminal ${getAllLeaves(tab.paneRoot).length + 1}`,
    };

    const splitNode: PaneSplit = {
      type: 'split',
      id: generatePaneId(),
      direction,
      ratio: 0.5,
      first: { ...target },
      second: newLeaf,
    };

    const newRoot = replaceNode(tab.paneRoot, paneId, splitNode);
    const newTabs = [...tabs];
    newTabs[tabIndex] = {
      ...tab,
      paneRoot: newRoot,
      activePaneId: newPaneId,
    };
    set({ tabs: newTabs });
    return newPaneId;
  },

  closePaneInTab: (tabId: string, paneId: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const leaves = getAllLeaves(tab.paneRoot);
    if (leaves.length <= 1) return;

    const parent = findParent(tab.paneRoot, paneId);
    if (!parent) return;

    const sibling = parent.first.id === paneId ? parent.second : parent.first;
    const newRoot = replaceNode(tab.paneRoot, parent.id, sibling);

    let newActiveId = tab.activePaneId;
    if (tab.activePaneId === paneId) {
      const remainingLeaves = getAllLeaves(newRoot);
      newActiveId = remainingLeaves[0]?.id || '';
    }

    const newSpawned = new Set(tab.spawnedPaneIds);
    newSpawned.delete(paneId);

    const newTabs = [...tabs];
    newTabs[tabIndex] = {
      ...tab,
      paneRoot: newRoot,
      activePaneId: newActiveId,
      spawnedPaneIds: newSpawned,
    };
    set({ tabs: newTabs });
  },

  renamePaneInTab: (tabId: string, paneId: string, name: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const target = findNode(tab.paneRoot, paneId);
    if (!target || target.type !== 'leaf') return;

    const updated: PaneLeaf = { ...target, name };
    const newTabs = [...tabs];
    newTabs[tabIndex] = {
      ...tab,
      paneRoot: replaceNode(tab.paneRoot, paneId, updated),
    };
    set({ tabs: newTabs });
  },

  resizeSplitInTab: (tabId: string, splitId: string, ratio: number) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const target = findNode(tab.paneRoot, splitId);
    if (!target || target.type !== 'split') return;

    const clampedRatio = Math.max(0.1, Math.min(0.9, ratio));
    const updated: PaneSplit = { ...target, ratio: clampedRatio };
    const newTabs = [...tabs];
    newTabs[tabIndex] = {
      ...tab,
      paneRoot: replaceNode(tab.paneRoot, splitId, updated),
    };
    set({ tabs: newTabs });
  },

  setActivePaneInTab: (tabId: string, paneId: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const newTabs = [...tabs];
    newTabs[tabIndex] = { ...tabs[tabIndex], activePaneId: paneId };
    set({ tabs: newTabs });
  },

  markPaneSpawned: (tabId: string, paneId: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const newSpawned = new Set(tab.spawnedPaneIds);
    newSpawned.add(paneId);

    const newTabs = [...tabs];
    newTabs[tabIndex] = { ...tab, spawnedPaneIds: newSpawned };
    set({ tabs: newTabs });
  },

  unmarkPaneSpawned: (tabId: string, paneId: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const newSpawned = new Set(tab.spawnedPaneIds);
    newSpawned.delete(paneId);

    const newTabs = [...tabs];
    newTabs[tabIndex] = { ...tab, spawnedPaneIds: newSpawned };
    set({ tabs: newTabs });
  },

  isPaneSpawned: (tabId: string, paneId: string) => {
    const { tabs } = get();
    const tab = tabs.find(t => t.id === tabId);
    return tab ? tab.spawnedPaneIds.has(paneId) : false;
  },

  getSpawnedPaneIds: (tabId: string) => {
    const { tabs } = get();
    const tab = tabs.find(t => t.id === tabId);
    return tab ? tab.spawnedPaneIds : new Set<string>();
  },

  clearSpawnedPanes: (tabId: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const newTabs = [...tabs];
    newTabs[tabIndex] = { ...tabs[tabIndex], spawnedPaneIds: new Set() };
    set({ tabs: newTabs });
  },

  // --- 에디터 탭 ---

  addEditorTab: (tabId: string, paneId: string, filePath: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const target = findNode(tab.paneRoot, paneId);
    if (!target || target.type !== 'leaf') return;

    const leaf = target as PaneLeaf;
    const fileName = filePath.split('/').pop() || filePath;

    // editorTabs 초기화 (없으면 터미널 탭 생성)
    const currentTabs: EditorTab[] = leaf.editorTabs || [
      { id: `${paneId}-terminal`, type: 'terminal', label: 'Terminal' },
    ];

    // 같은 파일이 이미 열려 있으면 해당 탭으로 전환
    const existing = currentTabs.find(t => t.type === 'file' && t.filePath === filePath);
    if (existing) {
      const updated: PaneLeaf = { ...leaf, editorTabs: currentTabs, activeEditorTabId: existing.id };
      const newTabs = [...tabs];
      newTabs[tabIndex] = { ...tab, paneRoot: replaceNode(tab.paneRoot, paneId, updated) };
      set({ tabs: newTabs });
      return;
    }

    const newEditorTab: EditorTab = {
      id: `editor-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: 'file',
      label: fileName,
      filePath,
    };

    const updated: PaneLeaf = {
      ...leaf,
      editorTabs: [...currentTabs, newEditorTab],
      activeEditorTabId: newEditorTab.id,
    };
    const newTabs = [...tabs];
    newTabs[tabIndex] = { ...tab, paneRoot: replaceNode(tab.paneRoot, paneId, updated) };
    set({ tabs: newTabs });
  },

  switchEditorTab: (tabId: string, paneId: string, editorTabId: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const target = findNode(tab.paneRoot, paneId);
    if (!target || target.type !== 'leaf') return;

    const updated: PaneLeaf = { ...target, activeEditorTabId: editorTabId };
    const newTabs = [...tabs];
    newTabs[tabIndex] = { ...tab, paneRoot: replaceNode(tab.paneRoot, paneId, updated) };
    set({ tabs: newTabs });
  },

  closeEditorTab: (tabId: string, paneId: string, editorTabId: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const target = findNode(tab.paneRoot, paneId);
    if (!target || target.type !== 'leaf') return;

    const leaf = target as PaneLeaf;
    if (!leaf.editorTabs) return;

    // 터미널 탭은 닫을 수 없음
    const closingTab = leaf.editorTabs.find(t => t.id === editorTabId);
    if (!closingTab || closingTab.type === 'terminal') return;

    const newEditorTabs = leaf.editorTabs.filter(t => t.id !== editorTabId);

    // 활성 탭이 닫히면 터미널 탭으로 복귀
    let newActiveId = leaf.activeEditorTabId;
    if (newActiveId === editorTabId) {
      const terminalTab = newEditorTabs.find(t => t.type === 'terminal');
      newActiveId = terminalTab?.id || newEditorTabs[0]?.id;
    }

    // 파일 탭이 모두 닫히면 editorTabs 제거 (기본 상태로 복귀)
    const hasFileTabs = newEditorTabs.some(t => t.type === 'file');
    const updated: PaneLeaf = hasFileTabs
      ? { ...leaf, editorTabs: newEditorTabs, activeEditorTabId: newActiveId }
      : { ...leaf, editorTabs: undefined, activeEditorTabId: undefined };

    const newTabs = [...tabs];
    newTabs[tabIndex] = { ...tab, paneRoot: replaceNode(tab.paneRoot, paneId, updated) };
    set({ tabs: newTabs });
  },

  setEditorTabDirty: (tabId: string, paneId: string, editorTabId: string, isDirty: boolean) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const target = findNode(tab.paneRoot, paneId);
    if (!target || target.type !== 'leaf') return;

    const leaf = target as PaneLeaf;
    if (!leaf.editorTabs) return;

    const newEditorTabs = leaf.editorTabs.map(t =>
      t.id === editorTabId ? { ...t, isDirty } : t
    );

    const updated: PaneLeaf = { ...leaf, editorTabs: newEditorTabs };
    const newTabs = [...tabs];
    newTabs[tabIndex] = { ...tab, paneRoot: replaceNode(tab.paneRoot, paneId, updated) };
    set({ tabs: newTabs });
  },

  toggleBroadcastMode: () => {
    set((state) => ({ broadcastMode: !state.broadcastMode }));
  },

  saveSession: async () => {
    try {
      const { tabs, activeTabId } = get();
      const sessionData = tabs.map(tab => ({
        id: tab.id,
        project: { path: tab.project.path, name: tab.project.name },
        activePaneId: tab.activePaneId,
      }));
      const data = JSON.stringify({ tabs: sessionData, activeTabId });
      if (window.api?.session?.save) {
        await window.api.session.save(data);
      }
    } catch (error) {
      console.error('세션 저장 실패:', error);
    }
  },

  restoreSession: async () => {
    try {
      if (!window.api?.session?.load) return false;
      const raw = await window.api.session.load();
      if (!raw) return false;

      const session = JSON.parse(raw);
      if (!session.tabs || !Array.isArray(session.tabs) || session.tabs.length === 0) return false;

      const { addTab, switchTab } = get();
      for (const tabData of session.tabs) {
        if (tabData.project?.path && tabData.project?.name) {
          addTab({
            path: tabData.project.path,
            name: tabData.project.name,
            lastOpened: new Date(),
            skillpackVersion: '1.9.3',
          });
        }
      }

      // 마지막 활성 탭 복원
      const { tabs } = get();
      if (session.activeTabId) {
        const matchTab = tabs.find(t =>
          session.tabs.some((st: any) => st.project?.path === t.project.path && st.id === session.activeTabId)
        );
        if (matchTab) switchTab(matchTab.id);
      }

      return tabs.length > 0;
    } catch (error) {
      console.error('세션 복원 실패:', error);
      return false;
    }
  },

  // --- 유틸리티 ---

  getTabByProject: (projectPath: string) => {
    const { tabs } = get();
    return tabs.find(t => t.project.path === projectPath) || null;
  },

  getAllLeavesInTab: (tabId: string) => {
    const { tabs } = get();
    const tab = tabs.find(t => t.id === tabId);
    return tab ? getAllLeaves(tab.paneRoot) : [];
  },
}));
