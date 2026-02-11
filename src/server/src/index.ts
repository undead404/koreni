import cors from 'cors';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';

import handleSubmit from './handlers/handle-submit';
import { rateLimitMiddleware } from './middlewares/rate-limiter';
import { bugsnagMiddleware } from './bugsnag';
import environment from './environment';

const app = express();

// Security headers - should be first
app.use(helmet());

// CORS configuration
app.use(cors({ origin: environment.NEXT_PUBLIC_SITE }));

// Body parsing
app.use(express.json({ limit: '60kb' }));

// Bugsnag Request Handler (must be the first middleware logic)
if (bugsnagMiddleware) {
  app.use(bugsnagMiddleware.requestHandler);
} else {
  console.warn(
    'Bugsnag middleware is not initialized. Requests will not be reported to Bugsnag.',
  );
}

// Rate Limiting (applied specifically to API routes)
app.use('/api', rateLimitMiddleware);

// Routes
app.post('/api/submit', handleSubmit);

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

// 404 Handler for undefined routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Not Found' });
});

// Bugsnag Error Handler (must be before any other error middleware)
if (bugsnagMiddleware) {
  app.use(bugsnagMiddleware.errorHandler);
} else {
  console.warn(
    'Bugsnag middleware is not initialized. Errors will not be reported to Bugsnag.',
  );
}

// Global Error Handler

app.use((error: Error, _request: Request, response: Response) => {
  console.error('Unhandled error:', error);
  // Ensure we don't try to send a response if one was already sent
  if (!response.headersSent) {
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

const server = app.listen(environment.PORT, () => {
  console.log(`Server running on http://localhost:${environment.PORT}`);
});

// Graceful Shutdown
const shutdown = () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force close after 10s if connections don't drain
  setTimeout(() => {
    console.error('Forcing server shutdown');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
