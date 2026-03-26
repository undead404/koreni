import { create } from 'zustand';

export type SubmissionStage =
  | 'idle'
  | 'conversion'
  | 'verification'
  | 'transmission';

export interface ContributionState {
  error: string;
  isSubmitting: boolean;
  prUrl: string;
  title: string;
  stage: SubmissionStage;
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
      stage: 'idle',
    },
    setState: (state: ContributionState) => set({ state }),
  }),
);
