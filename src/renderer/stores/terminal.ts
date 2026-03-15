import { create } from 'zustand';

interface SelectionOption {
  label: string;
  selected: boolean;
}

type TerminalStatus = 'idle' | 'running' | 'waiting_input' | 'waiting_selection';

interface TerminalState {
  status: TerminalStatus;
  selectionMode: boolean;
  options: SelectionOption[];
  setStatus: (status: TerminalStatus) => void;
  setSelectionMode: (enabled: boolean) => void;
  setOptions: (options: SelectionOption[]) => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as TerminalStatus,
  selectionMode: false,
  options: [],
};

export const useTerminalStore = create<TerminalState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setSelectionMode: (enabled) => set({ selectionMode: enabled }),
  setOptions: (options) => set({ options }),
  reset: () => set(initialState),
}));
