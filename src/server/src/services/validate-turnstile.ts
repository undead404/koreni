import environment from '../environment.js';
import {
  type TurnstileResponse,
  turnstileResponseSchema,
} from '../schemata.js';

import { reportError } from './bugsnag.js';

const URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export default async function validateTurnstile(
  ip: string,
  token: string,
): Promise<TurnstileResponse> {
  try {
    const body = JSON.stringify({
      secret: environment.TURNSTILE_SECRET_KEY,
      response: token || '',
      remoteip: ip,
    });

    const result = await fetch(URL, {
      body,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const outcome = await result.json();

    const parseResult = turnstileResponseSchema.safeParse(outcome);
    if (!parseResult.success) {
      reportError(parseResult.error);
      return {
        success: false,
        'error-codes': ['invalid-response-shape'],
      };
    }

    return parseResult.data;
  } catch (error) {
    reportError(error);
    return {
      success: false,
      'error-codes': ['network-error'],
    };
  }
}
