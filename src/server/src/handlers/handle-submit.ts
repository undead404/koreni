import type { RequestHandler } from 'express';

import environment from '../environment';
import { protectedImportPayloadSchema } from '../schemata';
import submitToGithub from '../services/github';
import posthog from '../services/posthog';
import validateTurnstile from '../services/validate-turnstile';

const handleSubmit: RequestHandler = async (request, response) => {
  try {
    // 1. Валідація даних (Zod)
    const parseResult = protectedImportPayloadSchema.safeParse(request.body);

    if (!parseResult.success) {
      posthog.capture({
        distinctId: request.socket.remoteAddress,
        event: 'payload_validation_failed',
        properties: {
          errors: parseResult.error.errors,
        },
      });
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
        posthog.capture({
          distinctId: ip as string,
          event: 'turnstile_validation_failed',
          properties: {
            ip,
            reason: turnstileValidationResult['error-codes'] || [],
          },
        });
        return response
          .status(403)
          .json({ error: 'Captcha validation failed' });
      }
    }

    // 3. Відправка на GitHub
    // Видаляємо токен капчі перед відправкою, щоб не смітити в payload
    try {
      await submitToGithub(
        {
          ...data,
          turnstileToken: undefined,
        },
        ip as string,
      );
    } catch (error) {
      console.error('Error submitting to GitHub:', error);
      posthog.captureException(error as Error);
      return response
        .status(502)
        .json({ error: 'Failed to trigger GitHub pipeline' });
    }
    posthog.capture({
      distinctId: ip as string,
      event: 'pr_creation_triggered',
    });

    return response.json({ success: true, message: 'PR creation started' });
  } catch (error) {
    console.error(error);
    posthog.captureException(error as Error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handleSubmit;
