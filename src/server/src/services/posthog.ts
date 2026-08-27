import { PostHog } from 'posthog-node';

import environment from '../environment.js';

const posthog = new PostHog(environment.POSTHOG_KEY, {
  host: environment.POSTHOG_HOST,
});

const safePosthog = {
  capture(properties: Parameters<PostHog['capture']>[0]) {
    try {
      posthog.capture(properties);
    } catch {
      // Product analytics must never affect application behavior.
    }
  },
  captureException(error: unknown) {
    try {
      posthog.captureException(error);
    } catch {
      // Product analytics must never affect application behavior.
    }
  },
};

export default safePosthog;
