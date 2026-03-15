import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UpdateInfo } from '@shared/types';

export default function UpdatePage() {
  const navigate = useNavigate();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const info = await window.api.update.check();
        setUpdateInfo(info);
      } catch (error) {
        console.error('Update check error:', error);
      }
    };

    checkUpdate();
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      // 진행률 리스너 등록
      const unsubscribe = window.api.update.onProgress((progress) => {
        setDownloadProgress(progress);
        if (progress === 100) {
          setIsReady(true);
          setIsDownloading(false);
        }
      });

      // 다운로드 시작
      await window.api.update.download();

      // 리스너 정리
      return () => unsubscribe();
    } catch (err) {
      console.error('Download error:', err);
      setError('다운로드 실패. 다시 시도해주세요.');
      setIsDownloading(false);
    }
  };

  const handleInstall = async () => {
    try {
      await window.api.update.install();
    } catch (error) {
      console.error('Install error:', error);
      setError('설치 중 오류가 발생했습니다.');
    }
  };

  const newFeatures = [
    '새로운 /deep-research 스킬 추가',
    '터미널 성능 개선',
    '한글 입력 안정성 향상',
  ];

  const bugFixes = [
    '스킬 패널 스크롤 버그 수정',
    '라이선스 검증 오류 수정',
    '메모리 누수 문제 해결',
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 타이틀바 */}
      <header role="banner" className="h-10 bg-bg-secondary border-b border-bg-tertiary drag-region flex items-center px-4">
        <button
          onClick={() => navigate(-1)}
          className="no-drag text-text-muted hover:text-text-primary mr-4"
        >
          ← 뒤로
        </button>
        <span className="text-sm font-medium">업데이트</span>
      </header>

      {/* 콘텐츠 */}
      <main role="main" className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {!updateInfo ? (
            <div className="text-center py-12">
              <p className="text-text-muted mb-2">사용 중인 버전이 최신입니다.</p>
              <button
                onClick={() => navigate('/')}
                className="text-accent hover:underline"
              >
                메인으로 돌아가기
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">
                  새 버전 v{updateInfo.version} 사용 가능
                </h1>
                <p className="text-text-muted">
                  {updateInfo.publishedAt.toLocaleDateString()} 출시
                </p>
              </div>

              {/* 릴리즈 노트 */}
              <div className="bg-bg-secondary rounded-lg p-6 mb-6">
                <h2 className="font-bold mb-4">🎉 새로운 기능</h2>
                <ul className="space-y-2 text-sm">
                  {newFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-accent">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-bg-secondary rounded-lg p-6 mb-6">
                <h2 className="font-bold mb-4">🐛 버그 수정</h2>
                <ul className="space-y-2 text-sm">
                  {bugFixes.map((fix, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-status-success">•</span>
                      <span className="text-text-muted">{fix}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 다운로드 진행률 */}
              {isDownloading && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>다운로드 중...</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden" role="progressbar" aria-valuenow={downloadProgress} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="h-full bg-accent transition-all duration-200"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="p-4 bg-status-error/20 border border-status-error/50 rounded-lg mb-6">
                  <p className="text-status-error text-sm">{error}</p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-4">
                {isReady ? (
                  <button
                    onClick={handleInstall}
                    className="flex-1 py-3 bg-accent hover:bg-accent-hover text-bg-primary font-medium rounded-lg transition-colors"
                  >
                    설치 및 재시작
                  </button>
                ) : (
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    aria-busy={isDownloading}
                    className="flex-1 py-3 bg-accent hover:bg-accent-hover text-bg-primary font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? '다운로드 중...' : '지금 업데이트'}
                  </button>
                )}

                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-3 bg-bg-secondary hover:bg-bg-tertiary font-medium rounded-lg transition-colors"
                >
                  나중에
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
