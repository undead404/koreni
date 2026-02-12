import Bugsnag from '@bugsnag/js';

import posthog from '../services/posthog';

export default function notifyAboutError(error: Error) {
  console.error('Error:', error);
  if (Bugsnag.isStarted()) {
    Bugsnag.notify(error);
  }
  if (posthog) {
    posthog.captureException(error);
  }
}
