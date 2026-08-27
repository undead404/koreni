import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import environment from './environment.js';
import { logger } from './logger.js';

const app = createApp();

logger.info('server.started', { port: environment.PORT });

serve({
  fetch: app.fetch,
  port: Number(environment.PORT) || 3000,
});
