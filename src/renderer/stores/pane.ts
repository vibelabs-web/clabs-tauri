// Zustand 패인 스토어 - 이진 트리 기반 스플릿 패인 상태 관리

import { create } from 'zustand';
import type {
  PaneNode,
  PaneLeaf,
  PaneSplit,
  SplitDirection,
} from '@shared/pane-types';
import {
  getAllLeaves as getLeaves,
  findNode,
  findParent,
  replaceNode,
  generatePaneId,
} from '@shared/pane-types';

const DEFAULT_PANE_ID = 'pane-default';

function createDefaultRoot(): PaneLeaf {
  return { type: 'leaf', id: DEFAULT_PANE_ID, name: 'Terminal' };
}

interface PaneStore {
  root: PaneNode;
  activePaneId: string;

  // 패인 분할: 리프 → 스플릿 (원본 + 새 패인)
  splitPane: (paneId: string, direction: SplitDirection) => string | null;
  // 패인 닫기: 리프 삭제, 형제가 부모 위치 차지
  closePane: (paneId: string) => void;
  // 패인 이름 변경
  renamePane: (paneId: string, name: string) => void;
  // 분할 비율 조정
  resizeSplit: (splitId: string, newRatio: number) => void;
  // 활성 패인 설정
  setActivePaneId: (paneId: string) => void;
  // 모든 리프 노드 반환
  getAllLeaves: () => PaneLeaf[];
  // 트리 초기화 (프로젝트 변경 시)
  reset: () => void;
}

export const usePaneStore = create<PaneStore>()((set, get) => ({
  root: createDefaultRoot(),
  activePaneId: DEFAULT_PANE_ID,

  splitPane: (paneId: string, direction: SplitDirection) => {
    const { root } = get();
    const target = findNode(root, paneId);
    if (!target || target.type !== 'leaf') return null;

    const newPaneId = generatePaneId();
    const newLeaf: PaneLeaf = {
      type: 'leaf',
      id: newPaneId,
      name: `Terminal ${get().getAllLeaves().length + 1}`,
    };

    const splitNode: PaneSplit = {
      type: 'split',
      id: generatePaneId(),
      direction,
      ratio: 0.5,
      first: { ...target },
      second: newLeaf,
    };

    const newRoot = replaceNode(root, paneId, splitNode);
    set({ root: newRoot, activePaneId: newPaneId });
    return newPaneId;
  },

  closePane: (paneId: string) => {
    const { root, activePaneId } = get();
    const leaves = getLeaves(root);

    // 마지막 패인은 삭제 불가
    if (leaves.length <= 1) return;

    const parent = findParent(root, paneId);
    if (!parent) return;

    // 형제 노드 (닫히는 패인의 반대쪽)
    const sibling = parent.first.id === paneId ? parent.second : parent.first;

    // 부모 스플릿 위치를 형제로 교체
    const newRoot = replaceNode(root, parent.id, sibling);

    // 활성 패인이 닫히면 남은 리프 중 첫 번째로 변경
    let newActiveId = activePaneId;
    if (activePaneId === paneId) {
      const remainingLeaves = getLeaves(newRoot);
      newActiveId = remainingLeaves[0]?.id || DEFAULT_PANE_ID;
    }

    set({ root: newRoot, activePaneId: newActiveId });
  },

  renamePane: (paneId: string, name: string) => {
    const { root } = get();
    const target = findNode(root, paneId);
    if (!target || target.type !== 'leaf') return;

    const updated: PaneLeaf = { ...target, name };
    set({ root: replaceNode(root, paneId, updated) });
  },

  resizeSplit: (splitId: string, newRatio: number) => {
    const { root } = get();
    const target = findNode(root, splitId);
    if (!target || target.type !== 'split') return;

    const clampedRatio = Math.max(0.1, Math.min(0.9, newRatio));
    const updated: PaneSplit = { ...target, ratio: clampedRatio };
    set({ root: replaceNode(root, splitId, updated) });
  },

  setActivePaneId: (paneId: string) => {
    set({ activePaneId: paneId });
  },

  getAllLeaves: () => {
    return getLeaves(get().root);
  },

  reset: () => {
    set({
      root: createDefaultRoot(),
      activePaneId: DEFAULT_PANE_ID,
    });
  },
}));
