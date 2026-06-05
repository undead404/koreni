'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  type ProjectCreatePayload,
  projectCreatePayloadSchema,
} from '@/server/src/schemata';

import updateProject from '../api/update-project';

import AssetsTab from './_components/assets-tab';
import MetadataTab from './_components/metadata-tab';
import NavigationTabs from './_components/navigation-tabs';
import OperationsTab from './_components/operations-tab';
import ProjectHeader from './_components/project-header';
import { useAssetManager } from './_hooks/use-asset-manager';
import { useProjectData } from './_hooks/use-project-data';
import { useProjectSchemas } from './_hooks/use-project-schemas';
import { projectSearchParametersSchema, TabType } from './types';

import styles from './page.module.css';

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

        {activeTab === 'operations' && (
          <OperationsTab
            projectId={projectId}
            projectType={projectData?.type ?? ''}
          />
        )}
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
