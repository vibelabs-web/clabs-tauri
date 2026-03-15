// 패인 트리 데이터 구조 (이진 트리 기반 스플릿 패인)

export type SplitDirection = 'horizontal' | 'vertical';

export interface PaneLeaf {
  type: 'leaf';
  id: string;
  name: string;
}

export interface PaneSplit {
  type: 'split';
  id: string;
  direction: SplitDirection;
  ratio: number; // 0.0 ~ 1.0 (first 패인 비율)
  first: PaneNode;
  second: PaneNode;
}

export type PaneNode = PaneLeaf | PaneSplit;

export interface PaneState {
  root: PaneNode;
  activePaneId: string;
}

// 유틸리티: 모든 리프 노드 수집
export function getAllLeaves(node: PaneNode): PaneLeaf[] {
  if (node.type === 'leaf') return [node];
  return [...getAllLeaves(node.first), ...getAllLeaves(node.second)];
}

// 유틸리티: 노드 ID로 노드 찾기
export function findNode(root: PaneNode, id: string): PaneNode | null {
  if (root.id === id) return root;
  if (root.type === 'split') {
    return findNode(root.first, id) || findNode(root.second, id);
  }
  return null;
}

// 유틸리티: 부모 스플릿 노드 찾기
export function findParent(root: PaneNode, childId: string): PaneSplit | null {
  if (root.type === 'leaf') return null;
  if (root.first.id === childId || root.second.id === childId) return root;
  return findParent(root.first, childId) || findParent(root.second, childId);
}

// 유틸리티: 트리에서 노드 교체
export function replaceNode(root: PaneNode, targetId: string, replacement: PaneNode): PaneNode {
  if (root.id === targetId) return replacement;
  if (root.type === 'leaf') return root;
  return {
    ...root,
    first: replaceNode(root.first, targetId, replacement),
    second: replaceNode(root.second, targetId, replacement),
  };
}

// 유틸리티: 고유 ID 생성
let paneCounter = 0;
export function generatePaneId(): string {
  return `pane-${Date.now()}-${++paneCounter}`;
}
