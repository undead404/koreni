import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import revertSplit from '../../api/revert-split';
import saveImageSource from '../../api/save-image-source';
import splitSpread from '../../api/split-spread';
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
        sourceId: crypto.randomUUID(),
        isSplit: false,
        splitCropX: null,
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
        await saveImageSource(
          projectId,
          image.sourceId,
          crypto.randomUUID(),
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

  const handleSplitConfirm = async (
    imageId: string,
    cropX: number,
  ): Promise<void> => {
    const image = images.find((img) => img.id === imageId);
    if (!image) return;

    const leftPageId = crypto.randomUUID();
    const rightPageId = crypto.randomUUID();
    const imageIndex = images.indexOf(image);
    const leftPageSequence = imageIndex + 1;
    const rightPageSequence = leftPageSequence + 1;

    try {
      await splitSpread(projectId, image.sourceId, {
        cropX,
        leftPageId,
        rightPageId,
        leftPageSequence,
        rightPageSequence,
      });

      setImages((previous) =>
        previous.map((img) =>
          img.id === imageId
            ? { ...img, isSplit: true, splitCropX: cropX }
            : img,
        ),
      );
      toast.success('Розворот розділено');
    } catch {
      toast.error('Не вдалося розділити розворот');
    }
  };

  const handleRevertSplit = async (imageId: string): Promise<void> => {
    if (!globalThis.confirm('Скасувати розділення цього розвороту?')) {
      return;
    }

    const image = images.find((img) => img.id === imageId);
    if (!image) return;

    try {
      await revertSplit(projectId, image.sourceId);

      setImages((previous) =>
        previous.map((img) =>
          img.id === imageId
            ? { ...img, isSplit: false, splitCropX: null }
            : img,
        ),
      );
      toast.success('Розділення скасовано');
    } catch {
      toast.error('Не вдалося скасувати розділення');
    }
  };

  return {
    images,
    uploadState,
    fileInputReference,
    handleFileSelect,
    toggleRemove,
    startUpload,
    cancelUpload,
    handleSplitConfirm,
    handleRevertSplit,
  };
}
