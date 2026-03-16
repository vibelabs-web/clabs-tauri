// FilePreviewView - 파일 에디터 (textarea + line numbers + Ctrl+S 저장)

import { useEffect, useState, useRef, useCallback } from 'react';

interface FilePreviewViewProps {
  filePath: string;
  onDirtyChange?: (isDirty: boolean) => void;
}

const formatSize = (bytes: number): string => {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

export function FilePreviewView({ filePath, onDirtyChange }: FilePreviewViewProps) {
  const [editableContent, setEditableContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const isDirty = editableContent !== originalContent;
  const prevDirtyRef = useRef(false);
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;

  // Notify parent of dirty state changes (ref-based to avoid infinite loop)
  useEffect(() => {
    if (prevDirtyRef.current !== isDirty) {
      prevDirtyRef.current = isDirty;
      onDirtyChangeRef.current?.(isDirty);
    }
  }, [isDirty]);

  // Load file content
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (window.api?.fs?.readFile) {
      window.api.fs.readFile(filePath)
        .then((content) => {
          if (!cancelled) {
            setEditableContent(content);
            setOriginalContent(content);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(String(err));
            setLoading(false);
          }
        });

      // Get file size from preview API
      window.api.fs.readFilePreview(filePath, 1)
        .then((preview) => {
          if (!cancelled && preview) {
            setFileSize(preview.file_size);
          }
        })
        .catch(() => {});
    } else {
      setError('파일 읽기 API를 사용할 수 없습니다');
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [filePath]);

  // Save file
  const handleSave = useCallback(async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await window.api.fs.writeFile(filePath, editableContent);
      setOriginalContent(editableContent);
    } catch (err) {
      console.error('파일 저장 실패:', err);
      alert(`저장 실패: ${err}`);
    } finally {
      setSaving(false);
    }
  }, [filePath, editableContent, isDirty, saving]);

  // Ctrl+S / Cmd+S shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Handle Tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = editableContent.substring(0, start) + '  ' + editableContent.substring(end);
      setEditableContent(newContent);
      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  const extension = filePath.split('.').pop() || '';
  const lineCount = editableContent.split('\n').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        파일 로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* 파일 정보 바 */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-bg-secondary border-b border-border-default text-xs text-text-muted flex-shrink-0">
        <span className="truncate font-mono flex items-center gap-2">
          {filePath}
          {isDirty && <span className="text-accent font-semibold">(수정됨)</span>}
          {saving && <span className="text-yellow-400">저장 중...</span>}
        </span>
        <span className="flex-shrink-0 ml-4 flex items-center gap-3">
          <span>{lineCount}줄 · {formatSize(fileSize || new Blob([editableContent]).size)} · {extension || 'unknown'}</span>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              isDirty
                ? 'bg-accent text-white hover:bg-accent/80'
                : 'bg-bg-hover text-text-muted cursor-not-allowed'
            }`}
          >
            저장
          </button>
        </span>
      </div>

      {/* 에디터 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 overflow-hidden select-none bg-bg-secondary/50 text-text-muted/50 font-mono text-xs leading-5 text-right py-0"
          style={{ width: 50, minWidth: 50 }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="px-3 h-5">{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={editableContent}
          onChange={(e) => setEditableContent(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 bg-transparent text-text-primary font-mono text-xs leading-5 p-0 px-3 resize-none outline-none overflow-auto border-none"
          style={{
            tabSize: 2,
            caretColor: 'var(--color-accent, #60a5fa)',
          }}
        />
      </div>
    </div>
  );
}
