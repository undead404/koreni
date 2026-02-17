import { act, renderHook } from '@testing-library/react';
import posthog from 'posthog-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ConsentState } from '../schemas/consent';
import { initBugsnag, setBugsnagConsent } from '../services/bugsnag';
import { readCookieConsent, saveCookieConsent } from '../services/consent';

import { useCookieConsent } from './use-cookie-consent';

// Mock dependencies
vi.mock('posthog-js', () => ({
  default: {
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    set_config: vi.fn(),
  },
}));

vi.mock('../services/bugsnag', () => ({
  initBugsnag: vi.fn(),
  setBugsnagConsent: vi.fn(),
}));

vi.mock('../services/consent', () => ({
  readCookieConsent: vi.fn(),
  saveCookieConsent: vi.fn(),
}));

const posthogMock = vi.mocked(posthog);

describe('useCookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values and show banner if no consent saved', () => {
    vi.mocked(readCookieConsent).mockReturnValue(null);

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.isBannerShown).toBe(true);
    expect(result.current.consent).toEqual({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  });

  it('should initialize with saved consent and not show banner', () => {
    const savedConsent: ConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    vi.mocked(readCookieConsent).mockReturnValue(savedConsent);

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.isBannerShown).toBe(false);
    expect(result.current.consent).toEqual(savedConsent);

    // Verify applyConsent logic was called on init
    expect(posthogMock.opt_in_capturing).toHaveBeenCalled();
    expect(initBugsnag).toHaveBeenCalled();
    expect(setBugsnagConsent).toHaveBeenCalledWith(true);
  });

  it('acceptAll should save consent, update state, and apply settings', () => {
    vi.mocked(readCookieConsent).mockReturnValue(null);
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptAll();
    });

    const expectedConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
    };

    expect(saveCookieConsent).toHaveBeenCalledWith(expectedConsent);
    expect(result.current.consent).toEqual(expectedConsent);
    expect(result.current.isBannerShown).toBe(false);

    // PostHog analytics enabled
    expect(posthogMock.opt_in_capturing).toHaveBeenCalled();
    expect(posthogMock.set_config).toHaveBeenCalledWith({
      persistence: 'localStorage+cookie',
    });
  });

  it('rejectAll should save consent, update state, and apply settings', () => {
    vi.mocked(readCookieConsent).mockReturnValue(null);
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.rejectAll();
    });

    const expectedConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
    };

    expect(saveCookieConsent).toHaveBeenCalledWith(expectedConsent);
    expect(result.current.consent).toEqual(expectedConsent);
    expect(result.current.isBannerShown).toBe(false);

    // PostHog analytics disabled
    expect(posthog.opt_out_capturing).toHaveBeenCalled();
    expect(posthog.set_config).toHaveBeenCalledWith({
      persistence: 'sessionStorage',
    });
  });

  it('saveCustom should save specific settings', () => {
    vi.mocked(readCookieConsent).mockReturnValue(null);
    const { result } = renderHook(() => useCookieConsent());

    const customConsent: ConsentState = {
      necessary: true,
      analytics: false,
      marketing: true,
    };

    act(() => {
      result.current.saveCustom(customConsent);
    });

    expect(saveCookieConsent).toHaveBeenCalledWith(customConsent);
    expect(result.current.consent).toEqual(customConsent);
    expect(result.current.isBannerShown).toBe(false);
  });

  it('should show banner when open-cookie-settings event is dispatched', () => {
    vi.mocked(readCookieConsent).mockReturnValue({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.isBannerShown).toBe(false);

    act(() => {
      const event = new Event('open-cookie-settings');
      globalThis.dispatchEvent(event);
    });

    expect(result.current.isBannerShown).toBe(true);
  });
});
