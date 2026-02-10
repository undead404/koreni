import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import handleSubmit from './handlers/handle-submit';
import { bugsnagMiddleware } from './bugsnag';
import environment from './environment';

const app = express();

app.use(helmet());
app.use(cors({ origin: environment.NEXT_PUBLIC_SITE }));
app.use(express.json({ limit: '60kb' }));
if (bugsnagMiddleware) {
  app.use(bugsnagMiddleware.requestHandler);
} else {
  console.warn(
    'Bugsnag middleware is not initialized. Requests will not be reported to Bugsnag.',
  );
}

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
