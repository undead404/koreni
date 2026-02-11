import posthog from 'posthog-js';

import environment from '@/app/environment';

if (
  environment.NEXT_PUBLIC_POSTHOG_KEY &&
  environment.NEXT_PUBLIC_POSTHOG_HOST
) {
  posthog.init(environment.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: environment.NEXT_PUBLIC_POSTHOG_HOST,
    autocapture: false,
    // Enables capturing unhandled exceptions via Error Tracking
    capture_exceptions: true,
    // Turn on debug in development mode
    debug: environment.NODE_ENV === 'development',
    // Include the defaults option as required by PostHog
    defaults: '2025-11-30',
    ip: false,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
    opt_out_capturing_by_default: true,
    persistence: 'memory',
    ui_host: 'https://eu.posthog.com',
  });
}
