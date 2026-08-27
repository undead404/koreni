import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'koreni_sharhoroots_prompt_dismissed_at';
const COOKIE_CONSENT_KEY = 'koreni_cookie_consent';
const SUPPRESSION_PERIOD_MS = 365 * 24 * 60 * 60 * 1000; // ~1 year

export interface UseSharhorootsPromptReturn {
  isVisible: boolean;
  dismiss: () => void;
}

export const useSharhorootsPrompt = (): UseSharhorootsPromptReturn => {
  const [isVisible, setIsVisible] = useState(false);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // Silently swallow errors (e.g., private browsing, quota exceeded)
      // The prompt will reappear on next visit, which is acceptable
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // Check if cookie consent has been recorded
    // If not, defer showing the prompt until after cookie banner is dismissed
    try {
      const isCookieConsentExists =
        localStorage.getItem(COOKIE_CONSENT_KEY) !== null;
      if (!isCookieConsentExists) {
        setIsVisible(false);
        return;
      }
    } catch {
      // If localStorage is unavailable, don't show the prompt
      setIsVisible(false);
      return;
    }

    // Check if prompt has been dismissed
    try {
      const storedValue = localStorage.getItem(STORAGE_KEY);

      if (storedValue === null) {
        // No dismissal recorded; show the prompt
        setIsVisible(true);
        return;
      }

      // Parse the stored timestamp
      const dismissedAt = new Date(storedValue).getTime();

      // If parsing failed (NaN), treat as absent and show the prompt
      if (Number.isNaN(dismissedAt)) {
        setIsVisible(true);
        return;
      }

      // Check if suppression period has elapsed
      const now = Date.now();
      const elapsed = now - dismissedAt;

      if (elapsed > SUPPRESSION_PERIOD_MS) {
        // Suppression period expired; show the prompt again
        setIsVisible(true);
      } else {
        // Still within suppression period; hide the prompt
        setIsVisible(false);
      }
    } catch {
      // On any read error, treat as absent and show the prompt
      setIsVisible(true);
    }
  }, []);

  return { isVisible, dismiss };
};
