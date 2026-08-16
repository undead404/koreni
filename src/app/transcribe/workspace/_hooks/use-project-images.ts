import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';

import { nonEmptyString } from '@/shared/schemas/non-empty-string';

import getProject from '../../api/get-project';
import getProjectImages from '../../api/get-project-images';
import type { ProjectImage } from '../../schemata';

const projectSearchParametersSchema = z.object({
  projectId: nonEmptyString.regex(/^[a-z0-9-]+$/i),
});

export function useProjectImages() {
  const router = useRouter();
  const searchParameters = useSearchParams();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [projectLocale, setProjectLocale] = useState<string | undefined>();
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [hasRestoredIndex, setHasRestoredIndex] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate projectId search param
  useEffect(() => {
    try {
      const rawProjectId = searchParameters.get('projectId');
      const parsed = projectSearchParametersSchema.parse({
        projectId: rawProjectId,
      });
      setProjectId(parsed.projectId);
    } catch {
      router.push('/transcribe');
    }
  }, [router, searchParameters]);

  // Fetch images and project locale once projectId is valid
  useEffect(() => {
    if (!projectId) return;

    const activeProjectId = projectId;
    setIsLoading(true);
    setError(null);

    const abortController = new AbortController();

    async function fetchData() {
      try {
        const [imagesData, projectData] = await Promise.all([
          getProjectImages(activeProjectId, undefined, abortController.signal),
          getProject(activeProjectId, abortController.signal),
        ]);

        if (abortController.signal.aborted) return;

        setImages(imagesData);
        setProjectLocale(projectData.project.tableLocale);
        setIsLoading(false);

        if (imagesData.length === 0) {
          router.push(`/transcribe/project/?projectId=${activeProjectId}`);
        }
      } catch {
        if (abortController.signal.aborted) return;

        const message = 'Failed to load project data';
        setError(message);
        setIsLoading(false);
        toast.error(message);
      }
    }

    void fetchData();

    return () => {
      abortController.abort();
    };
  }, [projectId, router]);

  // Persistence for currentImageIndex
  useEffect(() => {
    if (hasRestoredIndex || !projectId || images.length === 0) return;

    const storageKey = `koreni_workspace_${projectId}_image_index`;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      const index = Number.parseInt(stored, 10);
      if (!Number.isNaN(index) && index >= 0 && index < images.length) {
        setCurrentImageIndex(index);
      }
    }
    setHasRestoredIndex(true);
  }, [projectId, images.length, hasRestoredIndex]);

  useEffect(() => {
    if (!hasRestoredIndex || !projectId) return;

    const storageKey = `koreni_workspace_${projectId}_image_index`;
    localStorage.setItem(storageKey, currentImageIndex.toString());
  }, [projectId, currentImageIndex, hasRestoredIndex]);

  const refetchImages = useCallback(async (): Promise<
    ProjectImage[] | null
  > => {
    if (!projectId) return null;
    const abortController = new AbortController();
    try {
      const imagesData = await getProjectImages(
        projectId,
        undefined,
        abortController.signal,
      );
      setImages(imagesData);
      return imagesData;
    } catch {
      // Silent failure — the workspace remains on the current image
      return null;
    }
  }, [projectId]);

  return {
    projectId,
    images,
    setImages,
    projectLocale,
    currentImageIndex,
    setCurrentImageIndex,
    isLoading,
    error,
    refetchImages,
  };
}
