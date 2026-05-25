'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useRef, useState } from 'react';

import requestApi from '../../services/api';

import styles from './page.module.css';

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  removed: boolean;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

type UploadState = 'idle' | 'uploading' | 'success';

export default function ProjectImagesUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(searchParams);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const fileInputReference = useRef<HTMLInputElement>(null);
  const abortControllerReference = useRef<AbortController | null>(null);

  // Cleanup object URLs to avoid memory leaks
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

    for (const image of filesToUpload) {
      if (signal.aborted) break;

      setImages((previous) =>
        previous.map((img) =>
          img.id === image.id ? { ...img, status: 'uploading' } : img,
        ),
      );

      try {
        const formData = new FormData();
        formData.append('file', image.file);

        await requestApi(`/api/transcribe/upload?projectId=${projectId}`, {
          method: 'POST',
          body: formData,
          signal,
        });

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

  const activeImagesCount = images.filter((img) => !img.removed).length;
  const isUploading = uploadState === 'uploading';
  const isSuccess = uploadState === 'success';

  if (images.length === 0) {
    return (
      <div className={styles.container}>
        <h1>Upload Images</h1>
        <p>Select JPEG images to upload to your project.</p>
        <input
          type="file"
          multiple
          accept="image/jpeg, image/jpg"
          onChange={handleFileSelect}
          ref={fileInputReference}
          style={{ display: 'none' }}
        />
        <button
          className={styles.button}
          onClick={() => fileInputReference.current?.click()}
        >
          Select Images
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Upload Images</h1>
        {!isUploading && !isSuccess && (
          <>
            <input
              type="file"
              multiple
              accept="image/jpeg, image/jpg"
              onChange={handleFileSelect}
              ref={fileInputReference}
              style={{ display: 'none' }}
            />
            <button
              className={styles.button}
              onClick={() => fileInputReference.current?.click()}
            >
              Select More Images
            </button>
          </>
        )}
      </div>

      {activeImagesCount > 100 && !isUploading && !isSuccess && (
        <div className={styles.warning}>
          You have selected more than 100 images. It is advised to split your
          document into smaller chunks.
        </div>
      )}

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
                  className={`${styles.button} ${image.removed ? styles.buttonSuccess : styles.buttonDanger}`}
                  onClick={() => { toggleRemove(image.id); }}
                >
                  {image.removed ? 'Include' : 'Remove'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        {isSuccess ? (
          <Link href={`/transcribe/${projectId}`} className={styles.link}>
            Start Transcribing
          </Link>
        ) : isUploading ? (
          <button
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={cancelUpload}
          >
            Cancel Upload
          </button>
        ) : (
          <button
            className={styles.button}
            onClick={() => { void startUpload(); }}
            disabled={activeImagesCount === 0}
          >
            Start Uploading {activeImagesCount} Images
          </button>
        )}
      </div>
    </div>
  );
}
