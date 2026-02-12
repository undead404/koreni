import { PostHog } from 'posthog-node';

import environment from '../environment';

const posthog =
  environment.POSTHOG_HOST && environment.POSTHOG_KEY
    ? new PostHog(environment.POSTHOG_KEY, {
        host: environment.POSTHOG_HOST,
      })
    : null;

export default posthog;
