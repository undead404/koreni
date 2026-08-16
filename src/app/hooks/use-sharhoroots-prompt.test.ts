import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSharhorootsPrompt } from './use-sharhoroots-prompt';

const STORAGE_KEY = 'koreni_sharhoroots_prompt_dismissed_at';
const COOKIE_CONSENT_KEY = 'koreni_cookie_consent';

describe('useSharhorootsPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns isVisible: false before useEffect fires (initial state)', () => {
    const { result } = renderHook(() => useSharhorootsPrompt());

    expect(result.current.isVisible).toBe(false);
  });

  it('returns isVisible: true when localStorage key is absent and cookie consent is present', () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ necessary: true }),
    );

    const { result } = renderHook(() => useSharhorootsPrompt());

    // After effect runs, isVisible should be true
    expect(result.current.isVisible).toBe(true);
  });

  it('returns isVisible: false when dismissed timestamp is within suppression period', () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ necessary: true }),
    );
    const oneSecondAgo = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem(STORAGE_KEY, oneSecondAgo);

    const { result } = renderHook(() => useSharhorootsPrompt());

    expect(result.current.isVisible).toBe(false);
  });

  it('returns isVisible: true when dismissed timestamp is older than suppression period', () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ necessary: true }),
    );
    const oneYearAndOneDayAgo = new Date(
      Date.now() - 366 * 24 * 60 * 60 * 1000,
    ).toISOString();
    localStorage.setItem(STORAGE_KEY, oneYearAndOneDayAgo);

    const { result } = renderHook(() => useSharhorootsPrompt());

    // After effect runs, isVisible should be true (suppression period expired)
    expect(result.current.isVisible).toBe(true);
  });

  it('returns isVisible: true when stored value is a non-date string (corruption guard)', () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ necessary: true }),
    );
    localStorage.setItem(STORAGE_KEY, 'not-a-date');

    const { result } = renderHook(() => useSharhorootsPrompt());

    // After effect runs, isVisible should be true (corrupted value treated as absent)
    expect(result.current.isVisible).toBe(true);
  });

  it('dismiss() sets isVisible to false', () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ necessary: true }),
    );

    const { result } = renderHook(() => useSharhorootsPrompt());

    // After effect runs, isVisible should be true
    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('dismiss() writes an ISO timestamp to localStorage', () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ necessary: true }),
    );

    const { result } = renderHook(() => useSharhorootsPrompt());

    act(() => {
      result.current.dismiss();
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(stored).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('dismiss() is safe when localStorage.setItem throws', () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ necessary: true }),
    );

    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

    const { result } = renderHook(() => useSharhorootsPrompt());

    act(() => {
      // Trigger effect
    });

    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isVisible).toBe(false);
    expect(setItemSpy).toHaveBeenCalled();

    setItemSpy.mockRestore();
  });

  it('returns isVisible: false when cookie consent key is absent (banner not yet dismissed)', () => {
    // Ensure cookie consent is absent
    localStorage.removeItem(COOKIE_CONSENT_KEY);

    const { result } = renderHook(() => useSharhorootsPrompt());

    expect(result.current.isVisible).toBe(false);

    act(() => {
      // Trigger effect
    });

    expect(result.current.isVisible).toBe(false);
  });
});
