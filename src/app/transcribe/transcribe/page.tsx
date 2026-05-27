'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';

import { nonEmptyString } from '@/shared/schemas/non-empty-string';

import getProjectImages from '../api/get-project-images';
import type { ProjectImage } from '../schemata';

import styles from './page.module.css';

const projectSearchParametersSchema = z.object({
  projectId: nonEmptyString.regex(/^[a-z0-9-]+$/i),
});

function TranscribeProjectPageContent() {
  const router = useRouter();
  const searchParameters = useSearchParams();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
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
    } catch (error_) {
      // eslint-disable-next-line no-console
      console.error('Invalid or missing projectId search param:', error_);
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
          router.push(`/transcribe/images/?projectId=${activeProjectId}`);
        }
      } catch (error_: unknown) {
        if (abortController.signal.aborted) return;

        // eslint-disable-next-line no-console
        console.error('Failed to fetch project images:', error_);
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

  if (!projectId || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Завантаження зображень проекту...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Готовність до транскрибування ({images.length} зображень)
      </h1>
      <p className={styles.message}>
        Проект {projectId} налаштований та містить {images.length} зображень.
      </p>
      <button
        className={styles.button}
        onClick={() => {
          router.push(`/transcribe/images/?projectId=${projectId}`);
        }}
      >
        Завантажити ще зображення
      </button>
    </div>
  );
}

export default function TranscribeProjectPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.loading}>Завантаження сторінки...</div>
        </div>
      }
    >
      <TranscribeProjectPageContent />
    </Suspense>
  );
}
