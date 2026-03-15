import { create } from 'zustand';

type StepStatus = 'pending' | 'current' | 'completed';

interface WorkflowStep {
  id: string;
  title: string;
  name: string;
  status: StepStatus;
  skill: string;
}

interface WorkflowState {
  steps: WorkflowStep[];
  currentStep: number;
  setSteps: (steps: WorkflowStep[]) => void;
  setCurrentStep: (step: number) => void;
  updateStepStatus: (index: number, status: StepStatus) => void;
  updateStep: (id: string, status: StepStatus) => void;
  nextStep: () => void;
  reset: () => void;
}

const initialState = {
  steps: [],
  currentStep: 0,
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...initialState,
  setSteps: (steps) => set({ steps }),
  setCurrentStep: (step) => set({ currentStep: step }),
  updateStepStatus: (index, status) =>
    set((state) => ({
      steps: state.steps.map((step, i) =>
        i === index ? { ...step, status } : step
      ),
    })),
  updateStep: (id, status) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === id ? { ...step, status } : step
      ),
    })),
  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },
  reset: () => set(initialState),
}));
