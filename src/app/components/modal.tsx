'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useRef } from 'react';

import styles from './modal.module.css';

interface ModalProperties {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function Modal({
  children,
  className,
  isOpen,
  onClose,
  title,
}: ModalProperties) {
  const dialogReference = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogReference.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      const dialog = dialogReference.current;
      if (!dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogReference}
      className={clsx(styles.container, className)}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}
