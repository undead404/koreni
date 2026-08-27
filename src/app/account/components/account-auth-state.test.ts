import { describe, expect, it } from 'vitest';

import {
  getLoginRedirectPath,
  getSafeReturnPath,
  isLoginRoute,
  normalizePathname,
  RequestGenerationTracker,
} from './account-auth-state';

describe('account-auth-state utilities', () => {
  describe('getSafeReturnPath', () => {
    it('keeps internal return paths and their query strings', () => {
      expect(getSafeReturnPath('/account/karma')).toBe('/account/karma');
      expect(getSafeReturnPath('/account/karma?tab=summary')).toBe(
        '/account/karma?tab=summary',
      );
    });

    it('falls back for missing or unsafe paths', () => {
      expect(getSafeReturnPath(null)).toBe('/account');
      expect(getSafeReturnPath('')).toBe('/account');
      expect(getSafeReturnPath('https://example.com')).toBe('/account');
      expect(getSafeReturnPath('//example.com')).toBe('/account');
      expect(getSafeReturnPath('/account/login')).toBe('/account');
      expect(getSafeReturnPath('/account/login/?next=/account/karma')).toBe(
        '/account',
      );
    });
  });

  describe('getLoginRedirectPath', () => {
    it('encodes the current path and query string', () => {
      expect(
        getLoginRedirectPath(
          '/account/karma',
          new URLSearchParams({ tab: 'summary' }),
        ),
      ).toBe('/account/login?returnTo=%2Faccount%2Fkarma%3Ftab%3Dsummary');
    });
  });

  describe('normalizePathname', () => {
    it('returns empty string for null/empty pathname', () => {
      expect(normalizePathname(null)).toBe('');
      expect(normalizePathname('')).toBe('');
    });

    it('strips trailing slash from paths longer than 1 character', () => {
      expect(normalizePathname('/account/login/')).toBe('/account/login');
      expect(normalizePathname('/account/')).toBe('/account');
      expect(normalizePathname('/')).toBe('/');
    });

    it('keeps paths without trailing slash intact', () => {
      expect(normalizePathname('/account/login')).toBe('/account/login');
      expect(normalizePathname('/account')).toBe('/account');
    });
  });

  describe('isLoginRoute', () => {
    it('identifies both /account/login and /account/login/ as login routes', () => {
      expect(isLoginRoute('/account/login')).toBe(true);
      expect(isLoginRoute('/account/login/')).toBe(true);
    });

    it('returns false for non-login routes', () => {
      expect(isLoginRoute('/account')).toBe(false);
      expect(isLoginRoute('/account/')).toBe(false);
      expect(isLoginRoute('/account/transcribe')).toBe(false);
      expect(isLoginRoute(null)).toBe(false);
    });
  });

  describe('RequestGenerationTracker', () => {
    it('tracks generations and identifies current generation', () => {
      const tracker = new RequestGenerationTracker();
      const gen1 = tracker.nextGeneration();

      expect(tracker.isCurrent(gen1)).toBe(true);

      const gen2 = tracker.nextGeneration();
      expect(tracker.isCurrent(gen1)).toBe(false);
      expect(tracker.isCurrent(gen2)).toBe(true);
    });

    it('invalidates active generations on demand', () => {
      const tracker = new RequestGenerationTracker();
      const gen1 = tracker.nextGeneration();

      tracker.invalidate();

      expect(tracker.isCurrent(gen1)).toBe(false);
    });
  });
});
