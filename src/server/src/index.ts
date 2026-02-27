import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import environment from './environment.js';

const app = createApp();

console.log(`Server running on http://localhost:${environment.PORT}`);

serve({
  fetch: app.fetch,
  port: Number(environment.PORT) || 3000,
});
