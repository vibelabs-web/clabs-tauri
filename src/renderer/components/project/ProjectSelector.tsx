// @TASK ProjectSelector - 프로젝트 선택 모달
// 앱 시작 시 또는 프로젝트 변경 시 폴더 선택

import { useEffect, useCallback } from 'react';
import { useProjectStore } from '@renderer/stores/project';

const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function ProjectSelector() {
  const {
    showProjectSelector,
    recentProjects,
    isLoading,
    selectProject,
    loadRecentProjects,
    removeRecentProject,
  } = useProjectStore();

  // 최근 프로젝트 로드
  useEffect(() => {
    if (showProjectSelector) {
      loadRecentProjects();
    }
  }, [showProjectSelector, loadRecentProjects]);

  // 폴더 선택 다이얼로그 열기
  const handleBrowseFolder = useCallback(async () => {
    try {
      if (window.api?.projects?.selectFolder) {
        const path = await window.api.projects.selectFolder();
        if (path) {
          await selectProject(path);
        }
      } else if (window.api?.dialog?.showOpenDialog) {
        const result = await window.api.dialog.showOpenDialog({
          properties: ['openDirectory'],
        });
        if (!result.canceled && result.filePaths.length > 0) {
          await selectProject(result.filePaths[0]);
        }
      }
    } catch (error) {
      console.error('폴더 선택 실패:', error);
    }
  }, [selectProject]);

  // 최근 프로젝트 선택
  const handleSelectRecent = useCallback(async (path: string) => {
    await selectProject(path);
  }, [selectProject]);

  // 최근 프로젝트 삭제
  const handleRemoveRecent = useCallback((e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    removeRecentProject(path);
  }, [removeRecentProject]);

  // 상대 시간 포맷
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return new Date(date).toLocaleDateString('ko-KR');
  };

  if (!showProjectSelector) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 모달 */}
      <div className="relative w-full max-w-md bg-bg-secondary rounded-xl shadow-xl border border-bg-tertiary overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-bg-tertiary">
          <h2 className="text-lg font-semibold text-text-primary">프로젝트 선택</h2>
          <p className="text-sm text-text-muted mt-1">
            Claude Code를 실행할 프로젝트 폴더를 선택하세요
          </p>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 space-y-4">
          {/* 폴더 찾아보기 버튼 */}
          <button
            onClick={handleBrowseFolder}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 bg-accent/10 border-2 border-dashed border-accent/30 rounded-lg hover:bg-accent/20 hover:border-accent/50 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-accent/20 rounded-lg text-accent">
              <FolderIcon />
            </div>
            <div className="text-left">
              <p className="font-medium text-text-primary">폴더 찾아보기...</p>
              <p className="text-xs text-text-muted">새 프로젝트 폴더 선택</p>
            </div>
          </button>

          {/* 최근 프로젝트 */}
          {recentProjects.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                <ClockIcon />
                최근 프로젝트
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentProjects.slice(0, 10).map((project) => (
                  <div
                    key={project.path}
                    onClick={() => !isLoading && handleSelectRecent(project.path)}
                    className={`w-full flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors group cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-bg-hover rounded text-text-muted group-hover:text-accent">
                      <FolderIcon />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-text-muted truncate" title={project.path}>
                        {project.path}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {formatRelativeTime(project.lastOpened)}
                      </span>
                      <button
                        onClick={(e) => handleRemoveRecent(e, project.path)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-status-error/20 text-text-muted hover:text-status-error transition-all"
                        title="목록에서 제거"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {recentProjects.length === 0 && (
            <div className="text-center py-4">
              <p className="text-text-muted text-sm">
                최근 프로젝트가 없습니다
              </p>
            </div>
          )}
        </div>

        {/* 푸터 (선택적으로 닫기 버튼 추가 가능) */}
        {/* 앱 시작 시에는 반드시 프로젝트를 선택해야 하므로 닫기 버튼 없음 */}
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
