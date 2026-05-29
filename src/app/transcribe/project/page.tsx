'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import SourcesInput from '@/app/components/contribute/sources-input';
import YearsInput from '@/app/components/contribute/years-input';
import {
  type ProjectCreatePayload,
  projectCreatePayloadSchema,
} from '@/server/src/schemata';
import { nonEmptyString } from '@/shared/schemas/non-empty-string';

import getProject from '../api/get-project';
import getProjectImages from '../api/get-project-images';
import getProjectSchemas from '../api/get-project-schemas';
import saveProjectImage from '../api/save-project-image';
import updateProject from '../api/update-project';

import styles from './page.module.css';

const SpatialInput = dynamic(
  () =>
    import('@/app/components/contribute/spatial-input').then(
      (module_) => module_.SpatialInput,
    ),
  { ssr: false },
);

// --- Types ---

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  removed: boolean;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

type UploadState = 'idle' | 'uploading' | 'success';

type TabType = 'metadata' | 'assets' | 'operations';

const projectSearchParametersSchema = z.object({
  projectId: nonEmptyString.regex(/^[a-z0-9-]+$/i),
});

// --- Hooks ---

function useProjectSchemas() {
  const [schemas, setSchemas] = useState<
    { enabled: boolean; label: string; value: string }[]
  >([]);

  useEffect(() => {
    let active = true;
    const loadSchemas = async () => {
      try {
        const data = await getProjectSchemas();
        if (active) {
          setSchemas(data);
        }
      } catch {
        /* ignore */
      }
    };
    void loadSchemas();
    return () => {
      active = false;
    };
  }, []);

  return schemas;
}

function useProjectData(
  projectId: string,
  reset: (data: ProjectCreatePayload) => void,
) {
  const [projectData, setProjectData] = useState<ProjectCreatePayload | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [existingImagesCount, setExistingImagesCount] = useState<number>(0);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);

    try {
      const [projResponse, imgs] = await Promise.all([
        getProject(projectId),
        getProjectImages(projectId),
      ]);

      if (projResponse.success) {
        setProjectData(projResponse.project);
        reset(projResponse.project);
      }
      setExistingImagesCount(imgs.length);
    } catch {
      toast.error('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, reset]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    projectData,
    setProjectData,
    isLoading,
    existingImagesCount,
    refreshImagesCount: async () => {
      try {
        const imgs = await getProjectImages(projectId);
        setExistingImagesCount(imgs.length);
      } catch {
        /* ignore */
      }
    },
  };
}

function useAssetManager(
  projectId: string,
  onUploadFinished: () => Promise<void>,
) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const fileInputReference = useRef<HTMLInputElement>(null);
  const abortControllerReference = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      for (const img of images) URL.revokeObjectURL(img.previewUrl);
    };
  }, [images]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const newFiles = [...event.target.files]
      .filter((file) => file.type === 'image/jpeg' || file.type === 'image/jpg')
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        removed: false,
        status: 'pending' as const,
      }));

    setImages((previous) => [...previous, ...newFiles]);
    if (fileInputReference.current) {
      fileInputReference.current.value = '';
    }
  };

  const toggleRemove = (id: string) => {
    setImages((previous) =>
      previous.map((img) =>
        img.id === id ? { ...img, removed: !img.removed } : img,
      ),
    );
  };

  const startUpload = async () => {
    setUploadState('uploading');
    abortControllerReference.current = new AbortController();
    const signal = abortControllerReference.current.signal;

    const filesToUpload = images.filter((img) => !img.removed);

    for (const [index, image] of filesToUpload.entries()) {
      if (signal.aborted) break;

      setImages((previous) =>
        previous.map((img) =>
          img.id === image.id ? { ...img, status: 'uploading' } : img,
        ),
      );

      try {
        await saveProjectImage(
          projectId,
          image.id,
          image.file,
          index + 1,
          signal,
        );

        setImages((previous) =>
          previous.map((img) =>
            img.id === image.id ? { ...img, status: 'success' } : img,
          ),
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          break;
        }
        setImages((previous) =>
          previous.map((img) =>
            img.id === image.id ? { ...img, status: 'error' } : img,
          ),
        );
      }
    }

    if (!signal.aborted) {
      setUploadState('success');
      await onUploadFinished();
    }
  };

  const cancelUpload = useCallback(() => {
    if (globalThis.confirm('Are you sure you want to cancel the upload?')) {
      abortControllerReference.current?.abort();
      setUploadState('idle');
      setImages((previous) =>
        previous.map((img) =>
          img.status === 'uploading' ? { ...img, status: 'pending' } : img,
        ),
      );
    }
  }, []);

  return {
    images,
    uploadState,
    fileInputReference,
    handleFileSelect,
    toggleRemove,
    startUpload,
    cancelUpload,
  };
}

// --- Components ---

interface ProjectHeaderProperties {
  projectData: ProjectCreatePayload | null;
  projectId: string;
  existingImagesCount: number;
}

function ProjectHeader({
  projectData,
  projectId,
  existingImagesCount,
}: ProjectHeaderProperties) {
  const yearsDisplay = useMemo(() => {
    if (!projectData?.yearsRange) return null;
    const [start, end] = projectData.yearsRange;
    if (start === end || projectData.yearsRange.length === 1) return start;
    return `${start} - ${end}`;
  }, [projectData?.yearsRange]);

  return (
    <div className={styles.header}>
      <div className={styles.projectInfo}>
        <h1 className={styles.title}>
          {projectData?.title || 'Project Details'}
        </h1>
        <div className={styles.metaSummary}>
          <span className={styles.badge}>{projectData?.type}</span>
          {projectData?.tableLocale && (
            <span>Locale: {projectData.tableLocale}</span>
          )}
          {yearsDisplay && <span>Years: {yearsDisplay}</span>}
        </div>
      </div>
      <div className={styles.ctaContainer}>
        {existingImagesCount === 0 ? (
          <button
            disabled
            className={styles.ctaButton}
            data-testid="enter-workspace-btn"
          >
            Enter Workspace
          </button>
        ) : (
          <Link
            href={`/transcribe/workspace/?projectId=${projectId}`}
            className={styles.ctaButton}
            data-testid="enter-workspace-btn"
          >
            Enter Workspace
          </Link>
        )}
      </div>
    </div>
  );
}

interface NavigationTabsProperties {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

function NavigationTabs({ activeTab, setActiveTab }: NavigationTabsProperties) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'metadata', label: 'Metadata' },
    { id: 'assets', label: 'Asset Manager' },
    { id: 'operations', label: 'Operations' },
  ];

  return (
    <nav className={styles.tabsContainer}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTabButton : ''}`}
          onClick={() => {
            setActiveTab(tab.id);
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

interface MetadataTabProperties {
  schemas: { enabled: boolean; label: string; value: string }[];
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
}

function MetadataTab({
  schemas,
  onSubmit,
  isSubmitting,
}: MetadataTabProperties) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProjectCreatePayload>();

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.fieldGroup}>
        <label htmlFor="type" className={styles.label}>
          Project Type
        </label>
        <select id="type" {...register('type')} className={styles.input}>
          <option value="">Select a type...</option>
          {schemas.map((schema) => (
            <option
              key={schema.value}
              value={schema.value}
              disabled={!schema.enabled}
            >
              {schema.label}
            </option>
          ))}
        </select>
        {errors.type && <p className={styles.error}>{errors.type.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="title" className={styles.label}>
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={styles.input}
        />
        {errors.title && <p className={styles.error}>{errors.title.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="id" className={styles.label}>
          ID (unique, read-only)
        </label>
        <input
          id="id"
          type="text"
          {...register('id')}
          disabled
          className={styles.input}
        />
        {errors.id && <p className={styles.error}>{errors.id.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="isHandwritten" className={styles.label}>
          Handwritten
        </label>
        <select
          id="isHandwritten"
          className={styles.input}
          {...register('isHandwritten', {
            setValueAs: (v) => v === 'true' || v === true,
          })}
        >
          <option value="true">Handwritten</option>
          <option value="false">Typed</option>
        </select>
        {errors.isHandwritten && (
          <p className={styles.error}>{errors.isHandwritten.message}</p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="tableLocale" className={styles.label}>
          Document Locale
        </label>
        <select
          id="tableLocale"
          {...register('tableLocale')}
          className={styles.input}
        >
          <option value="">Select locale...</option>
          <option value="uk">Ukrainian (uk)</option>
          <option value="pl">Polish (pl)</option>
          <option value="ru">Russian (ru)</option>
        </select>
        {errors.tableLocale && (
          <p className={styles.error}>{errors.tableLocale.message}</p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <SpatialInput
              value={field.value.join(',') || ''}
              onChange={(value) => {
                if (!value) {
                  field.onChange();
                  return;
                }
                const [lat, lng] = value.split(',').map(Number);
                field.onChange([lat, lng]);
              }}
            />
          )}
        />
        {errors.location && (
          <p className={styles.error}>{errors.location.message}</p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <Controller
          name="yearsRange"
          control={control}
          render={({ field }) => <YearsInput {...field} />}
        />
        {errors.yearsRange && (
          <p className={styles.error}>{errors.yearsRange.message}</p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <SourcesInput />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submitButton}
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

interface AssetsTabProperties {
  images: ImageFile[];
  uploadState: UploadState;
  fileInputReference: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  toggleRemove: (id: string) => void;
  startUpload: () => Promise<void>;
  cancelUpload: () => void;
}

function AssetsTab({
  images,
  uploadState,
  fileInputReference,
  handleFileSelect,
  toggleRemove,
  startUpload,
  cancelUpload,
}: AssetsTabProperties) {
  const activeImagesCount = images.filter((img) => !img.removed).length;
  const isUploading = uploadState === 'uploading';
  const isSuccess = uploadState === 'success';

  return (
    <div className={styles.assetContainer}>
      <div className={styles.assetHeader}>
        <h2>Upload Images</h2>
        {!isUploading && !isSuccess && (
          <div className={styles.assetActions}>
            <input
              type="file"
              multiple
              accept="image/jpeg, image/jpg"
              onChange={handleFileSelect}
              ref={fileInputReference}
              style={{ display: 'none' }}
            />
            <button
              className={styles.ctaButton}
              onClick={() => fileInputReference.current?.click()}
            >
              {images.length === 0 ? 'Select Images' : 'Select More Images'}
            </button>
          </div>
        )}
      </div>

      {activeImagesCount > 100 && !isUploading && !isSuccess && (
        <div className={styles.warning}>
          You have selected more than 100 images. It is advised to split your
          document into smaller chunks.
        </div>
      )}

      {images.length > 0 && (
        <div className={styles.grid}>
          {images.map((image) => (
            <div
              key={image.id}
              className={`${styles.tile} ${image.removed ? styles.tileDimmed : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl}
                alt={image.file.name}
                className={styles.preview}
              />

              {isUploading && image.status === 'uploading' && (
                <div className={styles.statusOverlay}>Uploading...</div>
              )}
              {image.status === 'success' && (
                <div className={styles.statusOverlay}>Done</div>
              )}
              {image.status === 'error' && (
                <div className={styles.statusOverlay}>Error</div>
              )}

              {!isUploading && !isSuccess && (
                <div className={styles.controls}>
                  <button
                    type="button"
                    className={`${styles.ctaButton} ${image.removed ? styles.btnSuccess : styles.btnDanger}`}
                    onClick={() => {
                      toggleRemove(image.id);
                    }}
                  >
                    {image.removed ? 'Include' : 'Remove'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className={styles.assetActions}>
          {isSuccess ? (
            <span className={styles.warning}>
              Upload complete successfully!
            </span>
          ) : isUploading ? (
            <button
              type="button"
              className={`${styles.ctaButton} ${styles.btnDanger}`}
              onClick={cancelUpload}
            >
              Cancel Upload
            </button>
          ) : (
            <button
              type="button"
              className={styles.ctaButton}
              onClick={() => {
                void startUpload();
              }}
              disabled={activeImagesCount === 0}
            >
              Start Uploading {activeImagesCount} Images
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function OperationsTab() {
  return (
    <div className={styles.operationsContainer}>
      <h2>Data Export Options</h2>
      <p className={styles.operationsPlaceholder}>
        Future features will include data exports to CSV, JSON, and XML format.
      </p>
      <div className={styles.operationsActions}>
        <button disabled className={styles.ctaButton}>
          Export to CSV (Disabled)
        </button>
        <button disabled className={styles.ctaButton}>
          Export to JSON (Disabled)
        </button>
        <button disabled className={styles.ctaButton}>
          Export to XML (Disabled)
        </button>
      </div>
    </div>
  );
}

// --- Main Page Component ---

function ProjectDetailsPageContent() {
  const [projectId, setProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('metadata');

  const searchParameters = useSearchParams();
  const router = useRouter();

  const methods = useForm<ProjectCreatePayload>({
    resolver: zodResolver(projectCreatePayloadSchema),
    defaultValues: {
      type: '' as unknown as ProjectCreatePayload['type'],
      id: '',
      title: '',
      isHandwritten: true,
      location: [],
      sources: [],
      tableLocale: undefined,
      yearsRange: [],
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Search parameters validation
  useEffect(() => {
    try {
      const { projectId: projectIdFromSearch } =
        projectSearchParametersSchema.parse({
          projectId: searchParameters.get('projectId'),
        });
      setProjectId(projectIdFromSearch);
    } catch {
      router.push('/transcribe');
    }
  }, [router, searchParameters]);

  const schemas = useProjectSchemas();
  const {
    projectData,
    setProjectData,
    isLoading,
    existingImagesCount,
    refreshImagesCount,
  } = useProjectData(projectId, reset);

  const assetManager = useAssetManager(projectId, refreshImagesCount);

  const onSubmit = async (data: ProjectCreatePayload) => {
    try {
      const updateData: Partial<ProjectCreatePayload> = { ...data };
      delete updateData.id;
      await updateProject(
        projectId,
        updateData as Omit<ProjectCreatePayload, 'id'>,
      );
      setProjectData(data);
      toast.success('Project details updated successfully');
    } catch {
      toast.error('Failed to update project details');
    }
  };

  const handleFormSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit(onSubmit)(event);
  };

  if (!projectId || isLoading) {
    return <div className={styles.loading}>Loading project details...</div>;
  }

  return (
    <main className={styles.root}>
      <ProjectHeader
        projectData={projectData}
        projectId={projectId}
        existingImagesCount={existingImagesCount}
      />

      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={styles.tabContent}>
        {activeTab === 'metadata' && (
          <FormProvider {...methods}>
            <MetadataTab
              schemas={schemas}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
            />
          </FormProvider>
        )}

        {activeTab === 'assets' && <AssetsTab {...assetManager} />}

        {activeTab === 'operations' && <OperationsTab />}
      </div>
    </main>
  );
}

export default function ProjectDetailsPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <ProjectDetailsPageContent />
    </Suspense>
  );
}
