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
          <h3 className={styles.title}>Налаштування файлів Cookie</h3>

          <div className={styles.optionsList}>
            {/* Necessary */}
            <label className={styles.optionItem}>
              <div>
                <p>Технічно необхідні</p>
                <p className={styles.optionDescription}>
                  Потрібні для роботи сайту (збереження цих налаштувань, а також
                  анонімне логування помилок).
                </p>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                className="checkbox-primary"
              />
            </label>

            {/* Analytics */}
            <label className={`${styles.optionItem}`}>
              <div>
                <p>Аналітика (PostHog)</p>
                <p className={styles.optionDescription}>
                  Допомагає нам зрозуміти, які функції сайту найпопулярніші.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={handleAnalyticsChange}
                className="checkbox-primary"
              />
            </label>
          </div>

          <div className={styles.buttons}>
            <button onClick={close} className="btn btn-secondary">
              Назад
            </button>
            <button onClick={save} className="btn btn-primary">
              Зберегти вибір
            </button>
          </div>
        </div>
      ) : (
        // --- 1. Простий вигляд ---
        <div className={styles.containerSimple}>
          <div>
            <h3 className={styles.title}>Ми цінуємо вашу приватність</h3>
            <p>
              Ми використовуємо файли cookie для покращення роботи сайту та
              аналітики. Ви можете погодитися на всі або налаштувати їх окремо.
            </p>
          </div>
          <div className={styles.buttons}>
            <button onClick={open} className="btn btn-outlined">
              Налаштувати
            </button>
            <button onClick={rejectAll} className="btn btn-secondary">
              Відхилити
            </button>
            <button onClick={acceptAll} className="btn btn-primary">
              Прийняти всі
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
