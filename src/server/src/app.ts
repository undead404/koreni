import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import handleSubmit from './handlers/handle-submit.js';
import { authMiddleware } from './middlewares/auth.js';
import { rateLimitMiddleware } from './middlewares/rate-limiter.js';
import { bugsnagMiddleware } from './services/bugsnag.js';
import environment from './environment.js';

export function createApp() {
  const app = new Hono();

  // Security headers - should be first
  app.use(secureHeaders({ crossOriginOpenerPolicy: false }));
  app.use(async (c, next) => {
    c.header('Cross-Origin-Opener-Policy', 'same-origin');
    await next();
  });
  if (bugsnagMiddleware) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    app.use(bugsnagMiddleware.requestHandler);
  }

  // CORS configuration
  app.use(cors({ origin: environment.NEXT_PUBLIC_SITE }));

  // Body parsing (limit 60kb)
  app.use(
    bodyLimit({
      maxSize: 10 * 1024 * 1024, // 2 MiB strict limit
      onError: (c) => c.json({ error: 'Overflow' }, 413),
    }),
  );

  // Rate Limiting (applied specifically to API routes)
  app.use('/api/*', rateLimitMiddleware);

  // Routes
  app.post('/api/submit', authMiddleware, handleSubmit);

  app.get('/api/health', (c) => {
    return c.json({ status: 'ok' });
  });

  // 404 Handler for undefined routes
  app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404);
  });

  // Global Error Handler
  app.onError((error, c) => {
    if (bugsnagMiddleware) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      return bugsnagMiddleware.errorHandler(error, c);
    }
    console.error('Unhandled error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  });

  return app;
}
