import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getTodayLocalDate,
  hasStoredVolunteerContactConsentForToday,
  hasVolunteerContactConsentForToday,
  isVolunteerContactConsentCurrent,
  VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY,
} from './volunteer-contact-consent';

describe('volunteer contact consent', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats the local calendar date with zero-padded fields', () => {
    const date = new Date(2024, 1, 3, 23, 59);
    expect(getTodayLocalDate(date)).toBe('2024-02-03');
  });

  it('accepts only the exact current local date marker', () => {
    const date = new Date(2024, 5, 7);
    expect(isVolunteerContactConsentCurrent('2024-06-07', date)).toBe(true);
    expect(isVolunteerContactConsentCurrent(null, date)).toBe(false);
    expect(isVolunteerContactConsentCurrent('2024-6-7', date)).toBe(false);
    expect(isVolunteerContactConsentCurrent('2024-06-06', date)).toBe(false);
    expect(isVolunteerContactConsentCurrent('2024-06-08', date)).toBe(false);
  });

  it('reads and writes only the site-wide date marker', () => {
    const date = new Date(2024, 1, 3);
    expect(hasStoredVolunteerContactConsentForToday(date)).toBe(true);
    expect(hasVolunteerContactConsentForToday(date)).toBe(true);
    expect(VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY).toBe(
      'koreni:volunteer-contact-consent-date:v1',
    );
    expect(
      globalThis.localStorage.getItem(VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY),
    ).toBe('2024-02-03');
    expect(
      `${VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY}2024-02-03`.match(
        /email|author|profile|table|@/i,
      ),
    ).toBeNull();
  });

  it('treats storage read errors as no remembered consent', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(hasVolunteerContactConsentForToday()).toBe(false);
  });

  it('reports storage write errors without claiming consent was remembered', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(hasStoredVolunteerContactConsentForToday()).toBe(false);
    expect(hasVolunteerContactConsentForToday()).toBe(false);
  });
});
