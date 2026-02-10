import type { RequestHandler } from 'express';

import environment from '../environment';
import getClientIdentifier from '../helpers/get-client-identifier';
import isValidApiKey from '../helpers/is-valid-api-key';
import { protectedImportPayloadSchema } from '../schemata';
import submitToGithub from '../services/github';
import posthog from '../services/posthog';
import validateTurnstile from '../services/validate-turnstile';

const handleSubmit: RequestHandler = async (request, response) => {
  try {
    // Extract API key from header
    const apiKey = request.headers['x-api-key'] as string | undefined;
    const ip =
      (request.headers['x-forwarded-for'] as string) ||
      request.socket.remoteAddress;
    const clientId = getClientIdentifier(request, apiKey);
    const isApiKeyAuth = isValidApiKey(apiKey);

    if (apiKey && !isApiKeyAuth) {
      posthog.capture({
        distinctId: clientId,
        event: 'invalid_api_key_attempt',
        properties: {
          apiKeyProvided: !!apiKey,
        },
      });
      return response.status(401).json({ error: 'Invalid API key' });
    }

    // 1. Валідація даних (Zod)
    const parseResult = protectedImportPayloadSchema.safeParse(request.body);

    if (!parseResult.success) {
      const clientId = getClientIdentifier(request, apiKey);
      posthog.capture({
        distinctId: clientId,
        event: 'payload_validation_failed',
        properties: {
          errors: parseResult.error.errors,
          authMethod: isApiKeyAuth ? 'api_key' : 'web',
        },
      });
      return response.status(400).json({ error: parseResult.error.format() });
    }

    const data = parseResult.data;

    // 2. Валідація Turnstile (Капча) - Обов'язково для VPS, але не для API!
    if (!isApiKeyAuth && environment.NODE_ENV === 'production') {
      const token = data.turnstileToken;

      if (!token) {
        posthog.capture({
          distinctId: clientId,
          event: 'turnstile_token_missing',
          properties: {
            ip,
          },
        });
        return response
          .status(400)
          .json({ error: 'Captcha token is required' });
      }

      const turnstileValidationResult = await validateTurnstile(
        ip as string,
        token,
      );
      if (!turnstileValidationResult.success) {
        posthog.capture({
          distinctId: clientId,
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
      distinctId: clientId,
      event: 'pr_creation_triggered',
      properties: {
        authMethod: isApiKeyAuth ? 'api_key' : 'web',
      },
    });

    return response.json({ success: true, message: 'PR creation started' });
  } catch (error) {
    console.error(error);
    posthog.captureException(error as Error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handleSubmit;
