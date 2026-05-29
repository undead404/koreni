import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';

import { nonEmptyString } from '@/shared/schemas/non-empty-string';

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
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
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

  // Fetch images once projectId is valid
  useEffect(() => {
    if (!projectId) return;

    const activeProjectId = projectId;
    setIsLoading(true);
    setError(null);

    const abortController = new AbortController();

    async function fetchImages() {
      try {
        const data = await getProjectImages(
          activeProjectId,
          abortController.signal,
        );
        if (abortController.signal.aborted) return;

        setImages(data);
        setIsLoading(false);

        if (data.length === 0) {
          router.push(`/transcribe/project/?projectId=${activeProjectId}`);
        }
      } catch {
        if (abortController.signal.aborted) return;

        const message = 'Failed to load project images';
        setError(message);
        setIsLoading(false);
        toast.error(message);
      }
    }

    void fetchImages();

    return () => {
      abortController.abort();
    };
  }, [projectId, router]);

  // Persistence for currentImageIndex
  useEffect(() => {
    if (!projectId || images.length === 0) return;

    const storageKey = `koreni_workspace_${projectId}_image_index`;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      const index = Number.parseInt(stored, 10);
      if (!Number.isNaN(index) && index >= 0 && index < images.length) {
        setCurrentImageIndex(index);
      }
    }
  }, [projectId, images.length]);

  useEffect(() => {
    if (!projectId) return;

    const storageKey = `koreni_workspace_${projectId}_image_index`;
    localStorage.setItem(storageKey, currentImageIndex.toString());
  }, [projectId, currentImageIndex]);

  return {
    projectId,
    images,
    setImages,
    currentImageIndex,
    setCurrentImageIndex,
    isLoading,
    error,
  };
}
