import { ConsentState, consentStateSchema } from '../schemas/consent';

const STORAGE_KEY = 'koreni_cookie_consent';

export function readCookieConsent() {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) {
    return null;
  }
  const unparsedData = JSON.parse(storedData) as unknown;
  const result = consentStateSchema.safeParse(unparsedData);
  if (!result.success) {
    return null;
  }
  return result.data;
}

export function saveCookieConsent(consent: ConsentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
}
