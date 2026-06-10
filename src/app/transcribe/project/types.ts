import { z } from 'zod';

import { ProjectCreatePayload } from '@/server/src/schemata';
import { nonEmptyString } from '@/shared/schemas/non-empty-string';

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  removed: boolean;
  status: 'pending' | 'uploading' | 'success' | 'error';
  sourceId: string;
  isSplit: boolean;
  splitCropX: number | null;
}

export type UploadState = 'idle' | 'uploading' | 'success';

export type TabType = 'metadata' | 'assets' | 'operations';

export const projectSearchParametersSchema = z.object({
  projectId: nonEmptyString.regex(/^[a-z0-9-]+$/i),
});

export interface ProjectHeaderProperties {
  projectData: ProjectCreatePayload | null;
  projectId: string;
  existingImagesCount: number;
}

export interface NavigationTabsProperties {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export interface MetadataTabProperties {
  schemas: { enabled: boolean; label: string; value: string }[];
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
}

export interface OperationsTabProperties {
  projectId: string;
  projectType: string;
}

export interface AssetsTabProperties {
  images: ImageFile[];
  uploadState: UploadState;
  fileInputReference: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  toggleRemove: (id: string) => void;
  startUpload: () => Promise<void>;
  cancelUpload: () => void;
  onSplitConfirm: (imageId: string, cropX: number) => Promise<void>;
  onRevertSplit: (imageId: string) => Promise<void>;
}
