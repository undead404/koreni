import { create } from 'zustand';

export type SubmissionStage =
  | 'idle'
  | 'conversion'
  | 'verification'
  | 'transmission';

export interface ContributionState {
  activeIndex: number;
  error: string;
  isSubmitting: boolean;
  prUrl: string;
  title: string;
  stage: SubmissionStage;
}

export interface ContributionStateStore {
  state: ContributionState;
  setState: (state: Partial<ContributionState>) => void;
  setActiveIndex: (index: number | ((previous: number) => number)) => void;
  resetState: () => void;
}

const initialState: ContributionState = {
  activeIndex: 0,
  error: '',
  isSubmitting: false,
  prUrl: '',
  title: '',
  stage: 'idle',
};

export const useContributionStateStore = create<ContributionStateStore>(
  (set) => ({
    state: initialState,
    setState: (state) =>
      set((store) => ({
        state: {
          ...store.state,
          ...state,
        },
      })),
    setActiveIndex: (index) =>
      set((store) => ({
        state: {
          ...store.state,
          activeIndex:
            typeof index === 'function'
              ? index(store.state.activeIndex)
              : index,
        },
      })),
    resetState: () =>
      set(() => ({
        state: initialState,
      })),
  }),
);
