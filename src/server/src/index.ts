import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import handleSubmit from './handlers/handle-submit';
import { rateLimitMiddleware } from './middlewares/rate-limiter';
import { bugsnagMiddleware } from './services/bugsnag';
import environment from './environment';

const app = express();

app.use(helmet());
if (bugsnagMiddleware) {
  app.use(bugsnagMiddleware.requestHandler);
} else {
  console.warn(
    'Bugsnag middleware is not initialized. Requests will not be reported to Bugsnag.',
  );
}
app.use(cors({ origin: environment.NEXT_PUBLIC_SITE }));
app.use(express.json({ limit: '60kb' }));
app.use(rateLimitMiddleware);

app.post('/api/submit', handleSubmit);

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});
if (bugsnagMiddleware) {
  app.use(bugsnagMiddleware.errorHandler);
} else {
  console.warn(
    'Bugsnag middleware is not initialized. Errors will not be reported to Bugsnag.',
  );
}
app.listen(environment.PORT, () => {
  console.log(`Server running on http://localhost:${environment.PORT}`);
});
