import { PostHog } from 'posthog-node';

import environment from '../environment.js';

const posthog = new PostHog(environment.POSTHOG_KEY, {
  host: environment.POSTHOG_HOST,
});

export default posthog;
