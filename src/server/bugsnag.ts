import Bugsnag from '@bugsnag/js';
import BugsnagPluginExpress from '@bugsnag/plugin-express';

import environment from './environment';

Bugsnag.start({
  apiKey: environment.BUGSNAG_API_API_KEY,
  plugins: [BugsnagPluginExpress],
});

const middleware = Bugsnag.getPlugin('express');

export { middleware as bugsnagMiddleware };
