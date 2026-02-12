import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import handleImport from './handlers/handle-import';
import handleHealth from './handlers/health';
import notifyAboutError from './helpers/notify-about-error';
import errorMiddleware from './middlewares/error';
import { rateLimitMiddleware } from './middlewares/rate-limiter';
import uploadMiddleware from './middlewares/upload';
import environment from './environment';

const app = new Hono();

// Security headers - should be first
app.use(secureHeaders());

// CORS configuration for NEXT_PUBLIC_SITE (frontend)
app.use(
  '*',
  cors({
    origin: [environment.NEXT_PUBLIC_SITE],
    allowHeaders: ['X-Api-Key', 'X-Forwarded-For', 'Content-Type'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
  }),
);

// Body parsing
app.use(uploadMiddleware);

if (environment.NODE_ENV === 'production') {
  // Rate Limiting (applied specifically to API routes)
  app.use('/api/*', rateLimitMiddleware);
}

app.onError(errorMiddleware);

// Routes
app.post('/api/submit', handleImport);

app.get('/health', handleHealth);

// 404 Handler for undefined routes
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

const server = serve({
  fetch: app.fetch,
  port: environment.PORT,
});
server.on('listening', () => {
  console.log(`Server listening on port ${environment.PORT}`);
});
// Graceful Shutdown
process.on('SIGINT', () => {
  server.close((error) => {
    if (error) {
      notifyAboutError(error);
      process.exit(1);
    }
    process.exit(0);
  });
});
process.on('SIGTERM', () => {
  server.close((error) => {
    if (error) {
      notifyAboutError(error);
      process.exit(1);
    }
    process.exit(0);
  });
});
