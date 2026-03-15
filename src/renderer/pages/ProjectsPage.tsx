import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@shared/types';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const list = await window.api.projects.list();
        setProjects(list);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleSelectProject = async (path: string) => {
    try {
      await window.api.projects.open(path);
      navigate('/');
    } catch (error) {
      console.error('Failed to open project:', error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const folderPath = await window.api.projects.selectFolder();

      if (folderPath) {
        await window.api.projects.add(folderPath);
        // 프로젝트 목록 새로고침
        const list = await window.api.projects.list();
        setProjects(list);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    return `${days}일 전`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* 타이틀바 */}
      <header className="h-10 bg-bg-secondary border-b border-bg-tertiary drag-region flex items-center px-4">
        <span className="text-sm font-medium">프로젝트 선택</span>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">최근 프로젝트</h1>
            <button
              onClick={handleOpenFolder}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-bg-primary font-medium rounded-lg transition-colors"
            >
              폴더 열기
            </button>
          </div>

          {/* 프로젝트 목록 */}
          {isLoading ? (
            <div className="text-center text-text-muted py-12">
              로딩 중...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center text-text-muted py-12">
              <p className="mb-4">최근 프로젝트가 없습니다.</p>
              <button
                onClick={handleOpenFolder}
                className="text-accent hover:underline"
              >
                폴더를 선택하여 시작하세요
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.path}
                  onClick={() => handleSelectProject(project.path)}
                  className="w-full p-4 bg-bg-secondary hover:bg-bg-tertiary rounded-lg text-left transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium group-hover:text-accent transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-text-muted truncate">
                        {project.path}
                      </p>
                    </div>
                    <div className="text-right text-sm text-text-muted">
                      <p>{formatDate(project.lastOpened)}</p>
                      <p>v{project.skillpackVersion}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
