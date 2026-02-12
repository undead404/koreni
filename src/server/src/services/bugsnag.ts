import Bugsnag from '@bugsnag/js';

import environment from '../environment';

if (environment.BUGSNAG_API_API_KEY) {
  Bugsnag.start({
    apiKey: environment.BUGSNAG_API_API_KEY,
    releaseStage: environment.NODE_ENV,
  });
}

export { default } from '@bugsnag/js';
