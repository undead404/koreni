import Bugsnag from '@bugsnag/js';
import BugsnagPluginExpress from '@bugsnag/plugin-express';

import environment from '../environment';

if (environment.BUGSNAG_API_API_KEY) {
  Bugsnag.start({
    apiKey: environment.BUGSNAG_API_API_KEY,
    plugins: [BugsnagPluginExpress],
  });
}

const middleware = environment.BUGSNAG_API_API_KEY
  ? Bugsnag.getPlugin('express')
  : undefined;

export { middleware as bugsnagMiddleware };
