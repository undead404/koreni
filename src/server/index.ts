import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { bugsnagMiddleware } from './bugsnag';
import environment from './environment';
import { protectedImportPayloadSchema } from './schemata';
import validateTurnstile from './validate-turnstile';

const app = express();

// Безпека та парсинг JSON
app.use(helmet());
app.use(cors({ origin: environment.NEXT_PUBLIC_SITE })); // Тільки ваш домен
app.use(express.json({ limit: '60kb' }));
app.use(bugsnagMiddleware!.requestHandler);

app.post('/api/submit', async (request, response) => {
  try {
    // 1. Валідація даних (Zod)
    const parseResult = protectedImportPayloadSchema.safeParse(request.body);

    if (!parseResult.success) {
      return response.status(400).json({ error: parseResult.error.format() });
    }

    const data = parseResult.data;

    // 2. Валідація Turnstile (Капча) - Обов'язково для VPS!
    const token = data.turnstileToken;
    const ip =
      request.headers['x-forwarded-for'] || request.socket.remoteAddress;

    if (environment.NODE_ENV === 'production') {
      const turnstileValidationResult = await validateTurnstile(
        ip as string,
        token,
      );
      if (!turnstileValidationResult.success) {
        return response
          .status(403)
          .json({ error: 'Captcha validation failed' });
      }
    }

    // 3. Відправка на GitHub
    // Видаляємо токен капчі перед відправкою, щоб не смітити в payload
    const cleanData = {
      ...data,
      turnstileToken: undefined,
    };
    const githubResponse = await fetch(
      `https://api.github.com/repos/${environment.GITHUB_OWNER}/${environment.GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${environment.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Koreni-API-Server',
        },
        body: JSON.stringify({
          event_type: 'import_data',
          client_payload: cleanData,
        }),
      },
    );

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error('GitHub API Error:', errorText);
      return response
        .status(502)
        .json({ error: 'Failed to trigger GitHub pipeline' });
    }

    return response.json({ success: true, message: 'PR creation started' });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});
app.use(bugsnagMiddleware!.errorHandler);
app.listen(environment.PORT, () => {
  console.log(`Server running on http://localhost:${environment.PORT}`);
});
