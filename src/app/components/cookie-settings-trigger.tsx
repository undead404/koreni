'use client';

import { useCallback } from 'react';

export default function CookieSettingsTrigger() {
  const openSettings = useCallback(() => {
    // Використовуємо window замість globalThis для безпеки типів у DOM,
    // хоча globalThis теж працює.
    globalThis.dispatchEvent(new CustomEvent('open-cookie-settings'));
  }, []);

  return (
    <button
      onClick={openSettings}
      type="button" // Гарна практика явно вказувати type для кнопок
      className="button-text"
    >
      Налаштування Cookie
    </button>
  );
}
