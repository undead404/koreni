/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createRequire } from 'node:module';

import environment from '../environment.js';
import { type LogFields, sanitizeLogFields } from '../logger.js';

const require = createRequire(import.meta.url);
const Bugsnag = require('@bugsnag/js');
const BugsnagPluginHono = require('@bugsnag/plugin-hono');

if (environment.BUGSNAG_API_API_KEY) {
  Bugsnag.start({
    apiKey: environment.BUGSNAG_API_API_KEY,
    plugins: [BugsnagPluginHono],
  });
}

const middleware = environment.BUGSNAG_API_API_KEY
  ? Bugsnag.getPlugin('hono')
  : undefined;

export function reportError(error: unknown, metadata: LogFields = {}) {
  try {
    if (environment.BUGSNAG_API_API_KEY) {
      Bugsnag.notify(
        error,
        (event: {
          addMetadata: (section: string, data: LogFields) => void;
        }) => {
          event.addMetadata('koreni', sanitizeLogFields(metadata));
        },
      );
    } else {
      console.error('Bugsnag Error:', error);
    }
  } catch {
    // Telemetry failure must never affect the application response.
  }
}

export { Bugsnag, middleware as bugsnagMiddleware };
