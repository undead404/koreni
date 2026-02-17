'use client';

import { useCallback } from 'react';

export default function CookieSettingsTrigger() {
  const openSettings = useCallback(() => {
     
    window.dispatchEvent(new CustomEvent('open-cookie-settings'));
  }, []);

  return (
    <button onClick={openSettings} type="button" className="button-text">
      Налаштування Cookie
    </button>
  );
}
