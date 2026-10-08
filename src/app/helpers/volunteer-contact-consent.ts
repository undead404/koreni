export const VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY =
  'koreni:volunteer-contact-consent-date:v1';

export function getTodayLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isVolunteerContactConsentCurrent(
  marker: string | null,
  date: Date = new Date(),
): boolean {
  return marker === getTodayLocalDate(date);
}

export function hasVolunteerContactConsentForToday(
  date: Date = new Date(),
): boolean {
  try {
    return isVolunteerContactConsentCurrent(
      globalThis.localStorage.getItem(VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY),
      date,
    );
  } catch {
    return false;
  }
}

export function hasStoredVolunteerContactConsentForToday(
  date: Date = new Date(),
): boolean {
  try {
    globalThis.localStorage.setItem(
      VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY,
      getTodayLocalDate(date),
    );
    return true;
  } catch {
    return false;
  }
}
