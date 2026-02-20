'use client';

import { useCallback } from 'react';

export default function CookieSettingsTrigger() {
  const openSettings = useCallback(() => {
    globalThis.dispatchEvent(new CustomEvent('open-cookie-settings'));
  }, []);

  return (
    <button onClick={openSettings} type="button" className="button-text">
      Налаштування Cookie
    </button>
  );
}
