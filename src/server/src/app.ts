import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import handleProjectImageDelete from './handlers/handle-project-image-delete.js';
import handleProjectImageGet from './handlers/handle-project-image-get.js';
import handleProjectImagePut from './handlers/handle-project-image-put.js';
import handleProjectImagesList from './handlers/handle-project-images-list.js';
import handleKarmaLink from './handlers/handle-karma-link.js';
import handleKarmaLinkedUsers from './handlers/handle-karma-linked-users.js';
import handleKarmaLookup from './handlers/handle-karma-lookup.js';
import handleKarmaStatus from './handlers/handle-karma-status.js';
import handleSubmit from './handlers/handle-submit.js';
import handleTranscribeGoogleAuth from './handlers/handle-transcribe-auth-google.js';
import handleTranscribeAuthMe from './handlers/handle-transcribe-auth-me.js';
import handleTranscribeAuthDelete from './handlers/handle-transcribe-auth-session-delete.js';
import handleTranscribeProjectCreate from './handlers/handle-transcribe-project-create.js';
import handleTranscribeProjectGet from './handlers/handle-transcribe-project-get.js';
import handleTranscribeProjectList from './handlers/handle-transcribe-project-list.js';
import handleTranscribeProjectUpdate from './handlers/handle-transcribe-project-update.js';
import { apiAuthMiddleware } from './middlewares/api-auth.js';
import { rateLimitMiddleware } from './middlewares/rate-limiter.js';
import { requestLoggingMiddleware } from './middlewares/request-logging.js';
import { transcribeAuthMiddleware } from './middlewares/transcribe-auth.js';
import { bugsnagMiddleware, reportError } from './services/bugsnag.js';
import { getKarmaStatsMetadata } from './services/karma-source.js';
import environment from './environment.js';
import { logger } from './logger.js';
import type { ContextVariables } from './types.js';

export function createApp() {
  const app = new Hono<{ Variables: ContextVariables }>();

  app.use('*', requestLoggingMiddleware);

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
  app.use(cors({ credentials: true, origin: environment.NEXT_PUBLIC_SITE }));

  // Body parsing (limit 60kb)
  app.use(
    bodyLimit({
      maxSize: 10 * 1024 * 1024, // 2 MiB strict limit
      onError: (c) => c.json({ error: 'Overflow' }, 413),
    }),
  );

  // Rate Limiting (applied specifically to API routes)
  // app.use('/api/*', rateLimitMiddleware);

  // Routes
  app.post('/api/submit', rateLimitMiddleware, apiAuthMiddleware, handleSubmit);

  app.get('/api/health', async (c) => {
    if (!environment.BUILD_REVISION) {
      return c.json({
        build_revision: null,
        generated_at: null,
        index_revision: null,
        index_version: null,
        status: 'ok',
      });
    }

    try {
      const statsMetadata = await getKarmaStatsMetadata();
      return c.json({
        build_revision: environment.BUILD_REVISION,
        generated_at: statsMetadata.generatedAt,
        index_revision: statsMetadata.revision,
        index_version: statsMetadata.version,
        status: 'ok',
      });
    } catch (error) {
      reportError(error, {
        requestId: c.get('requestId'),
        method: c.req.method,
        path: c.req.path,
      });
      return c.json({
        build_revision: environment.BUILD_REVISION,
        generated_at: null,
        index_revision: null,
        index_version: null,
        status: 'ok',
      });
    }
  });

  app.post('/api/auth/google', rateLimitMiddleware, handleTranscribeGoogleAuth);
  app.get('/api/karma/linked-users', handleKarmaLinkedUsers);
  app.get('/api/karma/lookup', transcribeAuthMiddleware, handleKarmaLookup);
  app.get('/api/karma/status', transcribeAuthMiddleware, handleKarmaStatus);
  app.post('/api/karma/link', transcribeAuthMiddleware, handleKarmaLink);

  app.get('/api/auth/me', transcribeAuthMiddleware, handleTranscribeAuthMe);
  app.delete(
    '/api/auth/session/current',
    transcribeAuthMiddleware,
    handleTranscribeAuthDelete,
  );

  app.get(
    '/api/transcribe/projects',
    transcribeAuthMiddleware,
    handleTranscribeProjectList,
  );

  app.post(
    '/api/transcribe/projects',
    transcribeAuthMiddleware,
    handleTranscribeProjectCreate,
  );

  app.get(
    '/api/transcribe/projects/:projectId',
    transcribeAuthMiddleware,
    handleTranscribeProjectGet,
  );

  app.put(
    '/api/transcribe/projects/:projectId',
    transcribeAuthMiddleware,
    handleTranscribeProjectUpdate,
  );

  app.put(
    '/api/transcribe/projects/:projectId/images/:imageId',
    transcribeAuthMiddleware,
    handleProjectImagePut,
  );
  app.delete(
    '/api/transcribe/projects/:projectId/images/:imageId',
    transcribeAuthMiddleware,
    handleProjectImageDelete,
  );
  app.get(
    '/api/transcribe/projects/:projectId/images/:imageId',
    transcribeAuthMiddleware,
    handleProjectImageGet,
  );
  app.get(
    '/api/transcribe/projects/:projectId/images',
    transcribeAuthMiddleware,
    handleProjectImagesList,
  );
  app.get(
    '/api/transcribe/project/:projectId/images',
    transcribeAuthMiddleware,
    handleProjectImagesList,
  );

  // 404 Handler for undefined routes
  app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404);
  });

  // Global Error Handler
  app.onError((error, c) => {
    logger.error('request.unhandled_error', { error });
    reportError(error, {
      requestId: c.get('requestId'),
      method: c.req.method,
      path: c.req.path,
    });
    if (bugsnagMiddleware) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      return bugsnagMiddleware.errorHandler(error, c);
    }
    return c.json({ error: 'Internal Server Error' }, 500);
  });

  return app;
}
