import posthog from 'posthog-js';

import environment from '@/app/environment';

posthog.init(environment.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: environment.NEXT_PUBLIC_POSTHOG_HOST,
  ui_host: 'https://eu.posthog.com',
  // Include the defaults option as required by PostHog
  defaults: '2025-11-30',
  // Enables capturing unhandled exceptions via Error Tracking
  capture_exceptions: true,
  // Turn on debug in development mode
  debug: environment.NODE_ENV === 'development',
});
