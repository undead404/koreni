'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';

import styles from './spread-split-modal.module.css';

interface SpreadSplitModalProperties {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onConfirm: (cropX: number) => void;
  onCancel: () => void;
}

export default function SpreadSplitModal({
  imageUrl,
  imageWidth,
  imageHeight,
  onConfirm,
  onCancel,
}: SpreadSplitModalProperties) {
  const [cropX, setCropX] = useState<number>(0.5);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerReference = useRef<HTMLDivElement>(null);
  const dialogReference = useRef<HTMLDialogElement>(null);
  const confirmButtonReference = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  // Focus the confirm button on mount
  useEffect(() => {
    confirmButtonReference.current?.focus();
  }, []);

  // Escape key and focus trap
  useEffect(() => {
    const dialog = dialogReference.current;
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key === 'Tab') {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const focusableArray = [...focusable];
        const first = focusableArray[0];
        const last = focusableArray.at(-1);

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const container = containerReference.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newCropX = (event.clientX - rect.left) / rect.width;
    setCropX(Math.max(0.1, Math.min(0.9, newCropX)));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const aspectRatio =
    imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 2;

  return (
    <div className={styles.overlay} role="presentation">
      <dialog
        open
        ref={dialogReference}
        className={styles.dialog}
        aria-modal="true"
        aria-labelledby={headingId}
      >
        <h2 id={headingId} className={styles.heading}>
          Розділити розворот
        </h2>

        <div
          ref={containerReference}
          className={styles.previewContainer}
          style={{ aspectRatio: String(aspectRatio) }}
        >
          <Image
            src={imageUrl}
            alt="Попередній перегляд розвороту"
            fill
            className={styles.previewImage}
            unoptimized
          />

          <div
            role="separator"
            aria-label="Лінія розділення"
            className={styles.divider}
            style={{ left: `${cropX * 100}%` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className={styles.dividerHandle} />
          </div>

          <span
            className={styles.halfLabel}
            style={{ left: `${cropX * 25}%` }}
            aria-hidden="true"
          >
            Сторінка 1
          </span>
          <span
            className={styles.halfLabel}
            style={{ left: `${cropX * 100 + (1 - cropX) * 50}%` }}
            aria-hidden="true"
          >
            Сторінка 2
          </span>
        </div>

        <div className={styles.footer}>
          <button
            ref={confirmButtonReference}
            type="button"
            className={styles.confirmButton}
            onClick={() => {
              onConfirm(cropX);
            }}
          >
            Підтвердити
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Скасувати
          </button>
        </div>
      </dialog>
    </div>
  );
}
