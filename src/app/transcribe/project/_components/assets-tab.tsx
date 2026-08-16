'use client';

import { clsx } from 'clsx';
import { useState } from 'react';

import { AssetsTabProperties } from '../types';

import SpreadSplitModal from './spread-split-modal';

import styles from '../page.module.css';

export default function AssetsTab({
  images,
  uploadState,
  fileInputReference,
  handleFileSelect,
  toggleRemove,
  startUpload,
  cancelUpload,
  onSplitConfirm,
  onRevertSplit,
}: AssetsTabProperties) {
  const [splitModalImageId, setSplitModalImageId] = useState<string | null>(
    null,
  );

  const activeImagesCount = images.filter((img) => !img.removed).length;
  const isUploading = uploadState === 'uploading';
  const isSuccess = uploadState === 'success';

  const openSplitModal = (id: string) => {
    setSplitModalImageId(id);
  };

  const closeSplitModal = () => {
    setSplitModalImageId(null);
  };

  const modalImage =
    splitModalImageId === null
      ? undefined
      : images.find((img) => img.id === splitModalImageId);

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
              className={clsx(styles.tile, {
                [styles.tileDimmed]: image.removed,
              })}
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
                    className={clsx(styles.ctaButton, {
                      [styles.btnSuccess]: image.removed,
                      [styles.btnDanger]: !image.removed,
                    })}
                    onClick={() => {
                      toggleRemove(image.id);
                    }}
                  >
                    {image.removed ? 'Include' : 'Remove'}
                  </button>

                  {image.status === 'success' && (
                    <>
                      {image.isSplit ? (
                        <div className={styles.splitIndicator}>
                          <span aria-hidden="true">⊟</span>
                          <span>Розворот розділено</span>
                          <button
                            type="button"
                            className={clsx(styles.ctaButton, styles.btnDanger)}
                            onClick={() => {
                              void onRevertSplit(image.id);
                            }}
                            aria-label="Скасувати розділення"
                          >
                            Скасувати розділення
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.ctaButton}
                          onClick={() => {
                            openSplitModal(image.id);
                          }}
                          aria-label="Розділити розворот"
                        >
                          Розділити розворот
                        </button>
                      )}
                    </>
                  )}
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
              className={clsx(styles.ctaButton, styles.btnDanger)}
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

      {modalImage !== undefined && (
        <SpreadSplitModal
          imageUrl={modalImage.previewUrl}
          imageWidth={800}
          imageHeight={600}
          onConfirm={(cropX) => {
            void onSplitConfirm(splitModalImageId ?? '', cropX);
            closeSplitModal();
          }}
          onCancel={closeSplitModal}
        />
      )}
    </div>
  );
}
