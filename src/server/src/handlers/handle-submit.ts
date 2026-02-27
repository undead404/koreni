import type { Context } from 'hono';

import getClientIdentifier from '../helpers/get-client-identifier.js';
import { importPayloadSchema } from '../schemata.js';
import submitToGithub from '../services/github.js';
import posthog from '../services/posthog.js';

const handleSubmit = async (c: Context) => {
  try {
    const body = (await c.req.parseBody()) as unknown;
    const parseResult = importPayloadSchema.safeParse(body);

    const apiKey = c.req.header('x-api-key');
    const clientId = getClientIdentifier(c, apiKey);
    if (!parseResult.success) {
      posthog.capture({
        distinctId: clientId,
        event: 'payload_validation_failed',
        properties: {
          errors: parseResult.error.errors,
          authMethod: apiKey ? 'api_key' : 'web',
        },
      });
      return c.json({ error: parseResult.error.format() }, 400);
    }

    const data = parseResult.data;

    try {
      const pr = await submitToGithub(data);
      posthog.capture({
        distinctId: getClientIdentifier(c, apiKey),
        event: 'pr_creation_triggered',
        properties: {
          authMethod: apiKey ? 'api_key' : 'web',
        },
      });

      return c.json({
        success: true,
        message: 'PR creation started',
        url: pr.html_url,
      });
    } catch (error) {
      console.error('Error submitting to GitHub:', error);
      posthog.captureException(error as Error);
      return c.json({ error: `${error as Error}` }, 502);
    }
  } catch (error) {
    console.error(error);
    posthog.captureException(error as Error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

export default handleSubmit;
