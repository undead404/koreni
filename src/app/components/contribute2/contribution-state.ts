import { create } from 'zustand';
export interface ContributionState {
  error: string;
  isSubmitting: boolean;
  prUrl: string;
  title: string;
}

export interface ContributionStateStore {
  state: ContributionState;
  setState: (state: ContributionState) => void;
}

export const useContributionStateStore = create<ContributionStateStore>(
  (set) => ({
    state: {
      error: '',
      isSubmitting: false,
      prUrl: '',
      title: '',
    },
    setState: (state: ContributionState) => set({ state }),
  }),
);
