// 프로젝트 컨텍스트 (파일 트리) 스토어
import { create } from 'zustand';

export interface FileTreeNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileTreeNode[];
}

export interface FilePreview {
  content: string;
  total_lines: number;
  file_size: number;
  extension: string;
}

export interface CreatingItem {
  parentPath: string;
  type: 'file' | 'folder';
}

interface ContextState {
  tree: FileTreeNode[];
  loading: boolean;
  selectedFile: string | null;
  preview: FilePreview | null;
  previewLoading: boolean;
  expandedDirs: Set<string>;
  projectPath: string | null;
  creatingItem: CreatingItem | null;

  setTree: (tree: FileTreeNode[]) => void;
  setLoading: (loading: boolean) => void;
  selectFile: (path: string | null) => void;
  setPreview: (preview: FilePreview | null) => void;
  setPreviewLoading: (loading: boolean) => void;
  toggleDir: (path: string) => void;
  loadTree: (projectPath: string) => Promise<void>;
  loadPreview: (filePath: string) => Promise<void>;
  startCreateItem: (parentPath: string, type: 'file' | 'folder') => void;
  cancelCreateItem: () => void;
  confirmCreateItem: (name: string) => Promise<void>;
}

export const useContextStore = create<ContextState>((set, get) => ({
  tree: [],
  loading: false,
  selectedFile: null,
  preview: null,
  previewLoading: false,
  expandedDirs: new Set<string>(),
  projectPath: null,
  creatingItem: null,

  setTree: (tree) => set({ tree }),
  setLoading: (loading) => set({ loading }),
  selectFile: (path) => set({ selectedFile: path }),
  setPreview: (preview) => set({ preview }),
  setPreviewLoading: (loading) => set({ previewLoading: loading }),

  toggleDir: (path) => set((state) => {
    const expanded = new Set(state.expandedDirs);
    if (expanded.has(path)) {
      expanded.delete(path);
    } else {
      expanded.add(path);
    }
    return { expandedDirs: expanded };
  }),

  loadTree: async (projectPath) => {
    set({ loading: true, projectPath });
    try {
      if (window.api?.fs?.readTree) {
        const tree = await window.api.fs.readTree(projectPath);
        set({ tree, loading: false });
      }
    } catch (e) {
      console.error('파일 트리 로드 실패:', e);
      set({ loading: false });
    }
  },

  loadPreview: async (filePath) => {
    set({ previewLoading: true, selectedFile: filePath });
    try {
      if (window.api?.fs?.readFilePreview) {
        const preview = await window.api.fs.readFilePreview(filePath);
        set({ preview, previewLoading: false });
      }
    } catch (e) {
      console.error('파일 미리보기 실패:', e);
      set({ previewLoading: false, preview: null });
    }
  },

  startCreateItem: (parentPath, type) => {
    // 부모 디렉토리를 자동 확장
    set((state) => {
      const expanded = new Set(state.expandedDirs);
      expanded.add(parentPath);
      return { creatingItem: { parentPath, type }, expandedDirs: expanded };
    });
  },

  cancelCreateItem: () => {
    set({ creatingItem: null });
  },

  confirmCreateItem: async (name) => {
    const { creatingItem, projectPath, loadTree } = get();
    if (!creatingItem || !name.trim()) {
      set({ creatingItem: null });
      return;
    }

    const fullPath = `${creatingItem.parentPath}/${name.trim()}`;

    try {
      if (creatingItem.type === 'file') {
        await window.api.fs.createFile(fullPath);
      } else {
        await window.api.fs.createDir(fullPath);
      }
      set({ creatingItem: null });

      // 트리 새로고침
      if (projectPath) {
        await loadTree(projectPath);
      }
    } catch (err) {
      console.error('생성 실패:', err);
      alert(`생성 실패: ${err}`);
    }
  },
}));
