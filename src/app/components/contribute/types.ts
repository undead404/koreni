import type { ReactNode } from 'react';
import z from 'zod';

import { contributeFormSchema } from './schema';
import type { TableStateStore } from './table-state';

export interface ContributeFormProperties {
  knownLocations: {
    coordinates: [number, number];
    title: string;
  }[];
}

export type ContributeFormValues = z.infer<typeof contributeFormSchema>;

export type StepStatus = 'completed' | 'active' | 'pending';

export interface StepDefinition {
  fields: (keyof ContributeFormValues)[];
  icon: ReactNode;
  label: string;
  placeholderBody: string;
  placeholderTitle: string;
  renderContent?: () => ReactNode;
  summary:
    | ReactNode
    | ((
        tableStore: TableStateStore,
        formData: Partial<ContributeFormValues>,
      ) => ReactNode);
}

export interface StepProperties {
  onContinue: () => boolean;
}

export type DropzoneState =
  | 'idle'
  | 'drag-over'
  | 'uploading'
  | 'success'
  | 'error-type'
  | 'error-size'
  | 'error-parse';

export interface ParsedFile {
  name: string;
  size: number;
}

export type Location = ContributeFormProperties['knownLocations'][number];
