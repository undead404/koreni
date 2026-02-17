'use client';
import posthog from 'posthog-js';
import { PostHogProvider as Provider } from 'posthog-js/react';
import { useEffect } from 'react';

import environment from '@/app/environment';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      !environment.NEXT_PUBLIC_POSTHOG_KEY ||
      !environment.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      return;
    }

    posthog.init(environment.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: environment.NEXT_PUBLIC_POSTHOG_HOST,
      autocapture: false,
      // Enables capturing unhandled exceptions via Error Tracking
      capture_exceptions: true,
      // Turn on debug in development mode
      debug: environment.NODE_ENV === 'development',
      ip: false,
      loaded: (ph) => {
        if (environment.NODE_ENV === 'development') ph.debug();
      },
      opt_out_capturing_by_default: true,
      persistence: 'sessionStorage',
      ui_host: 'https://eu.posthog.com',
    });
  }, []);

  return <Provider client={posthog}>{children}</Provider>;
}
