// @TASK P4-T4 - 자동 업데이트 UI 알림 컴포넌트
// @SPEC docs/planning/04-phase-4-build.md#자동-업데이트-UI

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export function UpdateNotification() {
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // @ts-ignore - IPC 리스너
    window.electron?.on('update-download-progress', (progress: UpdateProgress) => {
      setUpdateProgress(progress);
      setIsVisible(true);
    });

    return () => {
      // @ts-ignore
      window.electron?.removeAllListeners('update-download-progress');
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && updateProgress && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-bg-secondary border border-white/10 rounded-lg p-4 shadow-lg min-w-[300px]"
        >
          <div className="flex items-start gap-3">
            {/* 아이콘 */}
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-accent-neon animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>

            {/* 내용 */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">
                업데이트 다운로드 중
              </h3>
              <p className="text-xs text-white/60 mb-2">
                {Math.round(updateProgress.percent)}% 완료 (
                {Math.round(updateProgress.transferred / 1024 / 1024)}MB /
                {Math.round(updateProgress.total / 1024 / 1024)}MB)
              </p>

              {/* 진행률 바 */}
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-accent-neon"
                  initial={{ width: 0 }}
                  animate={{ width: `${updateProgress.percent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
              aria-label="알림 닫기"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
