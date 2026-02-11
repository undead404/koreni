import posthog from 'posthog-js';
import { useCallback, useEffect, useState } from 'react';

import type { ConsentState } from '../schemas/consent';
import { initBugsnag, setBugsnagConsent } from '../services/bugsnag';
import { readCookieConsent, saveCookieConsent } from '../services/consent';

export const useCookieConsent = () => {
  const [isBannerShown, showBanner] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = readCookieConsent();

    if (consent) {
      setConsent(consent);
      applyConsent(consent);
    } else {
      showBanner(true);
    }
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => {
      showBanner(true);
    };
    globalThis.addEventListener('open-cookie-settings', handleOpenSettings);

    return () => {
      globalThis.removeEventListener(
        'open-cookie-settings',
        handleOpenSettings,
      );
    };
  });

  const applyConsent = useCallback((settings: ConsentState) => {
    // Логіка для PostHog
    if (settings.analytics) {
      posthog.opt_in_capturing();
      posthog.set_config({ persistence: 'localStorage+cookie' }); // Вмикаємо кукі
    } else {
      posthog.opt_out_capturing();
      posthog.set_config({ persistence: 'memory' });
    }

    // 2. Логіка BugSnag
    // Ініціалізуємо його (якщо ще не запущено)
    initBugsnag();

    // Встановлюємо дозвіл на відправку
    setBugsnagConsent(settings.necessary);
  }, []);

  const saveConsent = useCallback(
    (settings: ConsentState) => {
      saveCookieConsent(settings);
      setConsent(settings);
      applyConsent(settings);
      showBanner(false);
    },
    [applyConsent],
  );

  const acceptAll = useCallback(() => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  }, [saveConsent]);

  const rejectAll = useCallback(() => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  }, [saveConsent]);

  const saveCustom = useCallback(
    (customSettings: ConsentState) => {
      saveConsent(customSettings);
    },
    [saveConsent],
  );

  return { isBannerShown, consent, acceptAll, rejectAll, saveCustom };
};
