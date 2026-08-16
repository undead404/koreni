import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ProjectCreatePayload } from '@/server/src/schemata';

import getProject from '../../api/get-project';
import getProjectImages from '../../api/get-project-images';

export function useProjectData(
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
