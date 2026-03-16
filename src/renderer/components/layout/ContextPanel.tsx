// 프로젝트 컨텍스트 패널 - 파일 트리 (파일 클릭 시 에디터 탭으로 열기 + 파일/폴더 생성)
import React, { useEffect, useRef, useState } from 'react';
import { useContextStore } from '@renderer/stores/context';
import { useWorkspaceStore } from '@renderer/stores/workspace';
import type { FileTreeNode } from '@renderer/stores/context';

// 파일 아이콘 (확장자 기반)
const FileIcon: React.FC<{ name: string; isDir: boolean }> = ({ name, isDir }) => {
  if (isDir) {
    return (
      <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  }

  const ext = name.split('.').pop()?.toLowerCase() || '';
  let colorClass = 'text-text-muted';
  if (['ts', 'tsx'].includes(ext)) colorClass = 'text-blue-400';
  else if (['js', 'jsx'].includes(ext)) colorClass = 'text-yellow-400';
  else if (['rs'].includes(ext)) colorClass = 'text-orange-400';
  else if (['json', 'toml', 'yaml'].includes(ext)) colorClass = 'text-green-400';
  else if (['md', 'txt'].includes(ext)) colorClass = 'text-text-secondary';
  else if (['css', 'scss'].includes(ext)) colorClass = 'text-pink-400';

  return (
    <svg className={`w-4 h-4 ${colorClass} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

// 인라인 생성 입력 컴포넌트
const CreateItemInput: React.FC<{
  type: 'file' | 'folder';
  depth: number;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}> = ({ type, depth, onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (name.trim()) onConfirm(name.trim());
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="flex items-center gap-1.5 py-0.5 px-2"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      {type === 'folder' ? (
        <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        className="flex-1 bg-bg-hover text-text-primary text-sm px-1.5 py-0.5 rounded border border-accent outline-none"
        placeholder={type === 'file' ? '파일명' : '폴더명'}
      />
    </div>
  );
};

// 트리 노드 렌더링
const TreeNode: React.FC<{
  node: FileTreeNode;
  depth: number;
  selectedFile: string | null;
  expandedDirs: Set<string>;
  creatingParentPath: string | null;
  creatingType: 'file' | 'folder' | null;
  onToggleDir: (path: string) => void;
  onSelectFile: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void;
  onConfirmCreate: (name: string) => void;
  onCancelCreate: () => void;
}> = ({ node, depth, selectedFile, expandedDirs, creatingParentPath, creatingType, onToggleDir, onSelectFile, onContextMenu, onConfirmCreate, onCancelCreate }) => {
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedFile === node.path;
  const isCreatingHere = creatingParentPath === node.path;

  const handleClick = () => {
    if (node.is_dir) {
      onToggleDir(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
        className={`w-full text-left flex items-center gap-1.5 py-1 px-2 rounded text-sm hover:bg-bg-hover transition-colors ${
          isSelected ? 'bg-accent/10 text-accent' : 'text-text-primary'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.is_dir && (
          <svg
            className={`w-3 h-3 text-text-muted transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
        {!node.is_dir && <span className="w-3" />}
        <FileIcon name={node.name} isDir={node.is_dir} />
        <span className="truncate">{node.name}</span>
      </button>

      {node.is_dir && isExpanded && (
        <div>
          {/* 인라인 생성 입력 (이 디렉토리 안에 생성) */}
          {isCreatingHere && creatingType && (
            <CreateItemInput
              type={creatingType}
              depth={depth + 1}
              onConfirm={onConfirmCreate}
              onCancel={onCancelCreate}
            />
          )}
          {node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              expandedDirs={expandedDirs}
              creatingParentPath={creatingParentPath}
              creatingType={creatingType}
              onToggleDir={onToggleDir}
              onSelectFile={onSelectFile}
              onContextMenu={onContextMenu}
              onConfirmCreate={onConfirmCreate}
              onCancelCreate={onCancelCreate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ContextPanelProps {
  projectPath?: string;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ projectPath }) => {
  const {
    tree,
    loading,
    selectedFile,
    expandedDirs,
    loadTree,
    selectFile,
    toggleDir,
    creatingItem,
    startCreateItem,
    cancelCreateItem,
    confirmCreateItem,
  } = useContextStore();

  const { getActiveTab, addEditorTab } = useWorkspaceStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; dirPath: string } | null>(null);

  // 프로젝트 경로 변경 시 트리 로드
  useEffect(() => {
    if (projectPath) {
      loadTree(projectPath);
    }
  }, [projectPath, loadTree]);

  // 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleSelectFile = (path: string) => {
    selectFile(path);
    const activeTab = getActiveTab();
    if (activeTab) {
      addEditorTab(activeTab.id, activeTab.activePaneId, path);
    }
  };

  const handleRefresh = () => {
    if (projectPath) {
      loadTree(projectPath);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileTreeNode) => {
    if (!node.is_dir) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, dirPath: node.path });
  };

  const handleCreateInRoot = (type: 'file' | 'folder') => {
    if (projectPath) {
      startCreateItem(projectPath, type);
    }
  };

  const handleConfirmCreate = async (name: string) => {
    await confirmCreateItem(name);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-default flex-shrink-0">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          프로젝트 파일
        </h2>
        <div className="flex items-center gap-0.5">
          {/* 새 파일 */}
          <button
            onClick={() => handleCreateInRoot('file')}
            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
            title="새 파일"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          {/* 새 폴더 */}
          <button
            onClick={() => handleCreateInRoot('folder')}
            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
            title="새 폴더"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-2 5H5a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2h-4" />
            </svg>
          </button>
          {/* 새로고침 */}
          <button
            onClick={handleRefresh}
            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
            title="새로고침"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 파일 트리 */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="p-4 text-center text-sm text-text-muted">로딩 중...</div>
        ) : tree.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-muted">
            프로젝트를 열면 파일 트리가 표시됩니다
          </div>
        ) : (
          <>
            {/* 루트 레벨에서 생성 중일 때 */}
            {creatingItem && creatingItem.parentPath === projectPath && (
              <CreateItemInput
                type={creatingItem.type}
                depth={0}
                onConfirm={handleConfirmCreate}
                onCancel={cancelCreateItem}
              />
            )}
            {tree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                selectedFile={selectedFile}
                expandedDirs={expandedDirs}
                creatingParentPath={creatingItem?.parentPath || null}
                creatingType={creatingItem?.type || null}
                onToggleDir={toggleDir}
                onSelectFile={handleSelectFile}
                onContextMenu={handleContextMenu}
                onConfirmCreate={handleConfirmCreate}
                onCancelCreate={cancelCreateItem}
              />
            ))}
          </>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-bg-secondary border border-border-default rounded-md shadow-lg py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              startCreateItem(contextMenu.dirPath, 'file');
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-hover transition-colors"
          >
            새 파일
          </button>
          <button
            onClick={() => {
              startCreateItem(contextMenu.dirPath, 'folder');
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-hover transition-colors"
          >
            새 폴더
          </button>
        </div>
      )}
    </div>
  );
};
