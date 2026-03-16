// 파일 변경 Diff 미리보기 패널
// @TASK WU-2 - File Change Detection + Diff Preview
import React from 'react';
import { useDiffStore } from '@renderer/stores/diff';

// 변경 타입 아이콘
const ChangeTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'created':
      return <span className="text-green-400 font-bold text-xs">A</span>;
    case 'deleted':
      return <span className="text-red-400 font-bold text-xs">D</span>;
    default:
      return <span className="text-amber-400 font-bold text-xs">M</span>;
  }
};

// Diff 라인 렌더링
const DiffLine: React.FC<{ line: string }> = ({ line }) => {
  let className = 'text-text-primary';
  if (line.startsWith('+') && !line.startsWith('+++')) {
    className = 'text-green-400 bg-green-500/10';
  } else if (line.startsWith('-') && !line.startsWith('---')) {
    className = 'text-red-400 bg-red-500/10';
  } else if (line.startsWith('@@')) {
    className = 'text-cyan-400';
  } else if (line.startsWith('---') || line.startsWith('+++')) {
    className = 'text-text-muted font-bold';
  }

  return (
    <div className={`px-2 font-mono text-xs leading-5 whitespace-pre ${className}`}>
      {line}
    </div>
  );
};

export const DiffPanel: React.FC = () => {
  const { changes, selectedFile, selectFile, removeChange } = useDiffStore();

  if (changes.length === 0) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <p className="text-sm text-text-muted">파일 변경 사항이 없습니다</p>
      </div>
    );
  }

  const selectedChange = changes.find((c) => c.path === selectedFile);

  return (
    <div className="flex flex-col h-full">
      {/* 파일 목록 */}
      <div className="flex-shrink-0 border-b border-border-default overflow-y-auto max-h-48">
        {changes.map((change) => {
          const fileName = change.path.split('/').pop() || change.path;
          const isSelected = change.path === selectedFile;
          return (
            <button
              key={change.path}
              onClick={() => selectFile(change.path)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-bg-hover transition-colors ${
                isSelected ? 'bg-accent/10 border-l-2 border-accent' : ''
              }`}
            >
              <ChangeTypeIcon type={change.changeType} />
              <span className="text-sm text-text-primary truncate flex-1">{fileName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeChange(change.path);
                }}
                className="text-text-muted hover:text-red-400 transition-colors"
                title="무시"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </button>
          );
        })}
      </div>

      {/* Diff 내용 */}
      <div className="flex-1 overflow-y-auto">
        {selectedChange ? (
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs text-text-muted bg-bg-tertiary border-b border-border-default sticky top-0">
              {selectedChange.path}
            </div>
            {selectedChange.diff.split('\n').map((line, i) => (
              <DiffLine key={i} line={line} />
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-text-muted text-center">
            파일을 선택하여 변경 사항을 확인하세요
          </div>
        )}
      </div>
    </div>
  );
};
