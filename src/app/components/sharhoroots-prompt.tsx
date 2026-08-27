'use client';

import { usePathname } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSharhorootsPrompt } from '../hooks/use-sharhoroots-prompt';

import styles from './sharhoroots-prompt.module.css';

export default function SharhorootsPrompt() {
  const pathname = usePathname();
  const { isVisible, dismiss } = useSharhorootsPrompt();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dialogReference = useRef<HTMLDialogElement>(null);
  const posthog = usePostHog();

  useEffect(() => {
    const dialog = dialogReference.current;
    if (!dialog) return;

    if (isDialogOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isDialogOpen]);

  const handleInterested = useCallback(() => {
    posthog.capture('sharhoroots_prompt_interested');
    setIsDialogOpen(true);
  }, [posthog]);

  const handleDismissBanner = useCallback(() => {
    posthog.capture('sharhoroots_prompt_dismissed');
    dismiss();
  }, [dismiss, posthog]);

  const handleCloseDialog = useCallback(() => {
    posthog.capture('sharhoroots_prompt_closed');
    setIsDialogOpen(false);
    dismiss();
  }, [dismiss, posthog]);

  // Dialog should only close on explicit user action (button/link click)
  // Not on backdrop click or Escape key — user might accidentally trigger these

  if (pathname === '/not-welcome' || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Step 1: Compact bottom banner */}
      {!isDialogOpen && (
        <div className={styles.banner} role="status">
          <div className={styles.bannerContent}>
            <p className={styles.bannerQuestion}>
              А чи не з Шаргородщини ти випадково?
            </p>
            <div className={styles.bannerButtons}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleInterested}
              >
                Цікаво
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDismissBanner}
              >
                Ні
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Detail dialog */}
      {isDialogOpen && (
        <dialog ref={dialogReference} className={styles.dialog}>
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <h2 className={styles.dialogTitle}>
                Генеалогія Шаргородщини, Джуринщини та Мурафщини
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={handleCloseDialog}
                aria-label="Закрити"
              >
                ×
              </button>
            </div>
            <div className={styles.dialogBody}>
              <p>
                Є окремий ресурс — база знань для дослідження родоводу
                історичної Шаргородщини, Джуринщини та Мурафщини. Там зібрана
                інформація про населені пункти, парафії, архівні фонди та
                метричні книги регіону.
              </p>
              <p>
                Також існує спільнота на Facebook для обговорення та обміну
                знахідками.
              </p>
              <div className={styles.dialogLinks}>
                <a
                  href="https://sharhoroots.koreni.org.ua/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  onClick={() => {
                    posthog.capture('sharhoroots_prompt_resource_clicked');
                    handleCloseDialog();
                  }}
                >
                  Відкрити сайт генеалогії Шаргородщини
                </a>
                <a
                  href="https://www.facebook.com/groups/sharhoroots"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outlined"
                  onClick={() => {
                    posthog.capture('sharhoroots_prompt_facebook_clicked');
                    handleCloseDialog();
                  }}
                >
                  Спільнота на Facebook
                </a>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
