'use client';
import { type ChangeEvent, useCallback, useState } from 'react';

import { useCookieConsent } from '../hooks/use-cookie-consent';
import type { ConsentState } from '../schemas/consent';

import styles from './cookie-banner.module.css';

export default function CookieBanner() {
  const { isBannerShown, acceptAll, rejectAll, saveCustom } =
    useCookieConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [preferences, setPreferences] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  const handleAnalyticsChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setPreferences((previous) => ({
        ...previous,
        analytics: event.target.checked,
      })),
    [],
  );

  const close = useCallback(() => setIsSettingsOpen(false), []);
  const open = useCallback(() => setIsSettingsOpen(true), []);

  // Виправлено залежність useCallback, щоб зберігалися актуальні preferences
  const save = useCallback(() => {
    saveCustom(preferences);
  }, [preferences, saveCustom]);

  const shouldRender = isBannerShown || isSettingsOpen;

  if (!shouldRender) return null;

  return (
    <div className={styles.banner}>
      {isSettingsOpen ? (
        // --- 2. Детальні налаштування ---
        <div className={styles.containerSettings}>
          <h3 className={styles.settingsTitle}>Налаштування файлів Cookie</h3>

          <div className={styles.optionsList}>
            {/* Necessary */}
            <div className={styles.optionItem}>
              <div>
                <p className={styles.optionLabel}>Технічно необхідні</p>
                <p className={styles.description}>
                  Потрібні для роботи сайту (збереження цих налаштувань, а також
                  анонімне логування помилок).
                </p>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                className={styles.checkbox}
              />
            </div>

            {/* Analytics */}
            <div
              className={`${styles.optionItem} ${styles.optionItemInteractive}`}
            >
              <div>
                <p className={styles.optionLabel}>Аналітика (PostHog)</p>
                <p className={styles.description}>
                  Допомагає нам зрозуміти, які функції сайту найпопулярніші.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={handleAnalyticsChange}
                className={styles.checkbox}
              />
            </div>
          </div>

          <div className={styles.footerActions}>
            <button onClick={close} className={styles.btnLink}>
              Назад
            </button>
            <button
              onClick={save}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Зберегти вибір
            </button>
          </div>
        </div>
      ) : (
        // --- 1. Простий вигляд ---
        <div className={styles.containerSimple}>
          <div className={styles.textBlock}>
            <span className={styles.title}>Ми цінуємо вашу приватність</span>
            <p>
              Ми використовуємо файли cookie для покращення роботи сайту та
              аналітики. Ви можете погодитися на всі або налаштувати їх окремо.
            </p>
          </div>
          <div className={styles.buttonsGroup}>
            <button
              onClick={open}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Налаштувати
            </button>
            <button
              onClick={rejectAll}
              className={`${styles.btn} ${styles.btnOutline}`}
            >
              Відхилити
            </button>
            <button
              onClick={acceptAll}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Прийняти всі
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
