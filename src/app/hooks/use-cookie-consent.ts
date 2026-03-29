import { usePostHog } from 'posthog-js/react';
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
  const posthog = usePostHog();

  const applyConsent = useCallback(
    (settings: ConsentState) => {
      // Логіка для PostHog
      if (settings.analytics) {
        posthog.opt_in_capturing();
        posthog.capture('$pageview');
        posthog.set_config({ persistence: 'localStorage+cookie' });
      } else {
        posthog.opt_out_capturing();
        posthog.set_config({ persistence: 'sessionStorage' });
      }

      // 2. Логіка BugSnag
      // Ініціалізуємо його (якщо ще не запущено)
      initBugsnag();

      // Задаємо дозвіл на надсилання
      setBugsnagConsent(settings.necessary);
    },
    [posthog],
  );

  useEffect(() => {
    const consent = readCookieConsent();

    if (consent) {
      console.log('Consent found, applying');
      console.log('consent', consent); // Додано для дебагу
      setConsent(consent);
      applyConsent(consent);
    } else {
      console.log('No consent found, showing banner');
      showBanner(true);
    }
  }, [applyConsent]);

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
