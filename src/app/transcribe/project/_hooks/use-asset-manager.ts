import { useCallback, useEffect, useRef, useState } from 'react';

import saveProjectImage from '../../api/save-project-image';
import { ImageFile, UploadState } from '../types';

export function useAssetManager(
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
