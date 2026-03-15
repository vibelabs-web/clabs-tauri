import { create } from 'zustand';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  suggestedSkill: string;
  skill?: string; // backward compatibility
  reason?: string; // backward compatibility
}

interface RecommendationState {
  current: Recommendation | null;
  setRecommendation: (recommendation: Recommendation | null) => void;
  clear: () => void;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  current: null,
  setRecommendation: (recommendation) => set({ current: recommendation }),
  clear: () => set({ current: null }),
}));
