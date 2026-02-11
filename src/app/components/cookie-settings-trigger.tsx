'use client';

import { useCallback } from 'react';

import styles from './cookie-settings-trigger.module.css';

export default function CookieSettingsTrigger() {
  const openSettings = useCallback(() => {
    // Використовуємо window замість globalThis для безпеки типів у DOM,
    // хоча globalThis теж працює.
    globalThis.dispatchEvent(new CustomEvent('open-cookie-settings'));
  }, []);

  return (
    <button
      onClick={openSettings}
      className={styles.trigger}
      type="button" // Гарна практика явно вказувати type для кнопок
    >
      Налаштування Cookie
    </button>
  );
}
