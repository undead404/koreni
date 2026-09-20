import environment from '../environment.js';
import { logger } from '../logger.js';
import {
  navigatorErrorResponseSchema,
  type NavigatorIngestPayload,
  navigatorIngestPayloadSchema,
  type NavigatorIngestResponse,
  navigatorIngestResponseSchema,
  type NavigatorLinkRedeemPayload,
  navigatorLinkRedeemPayloadSchema,
  type NavigatorLinkRedeemResponse,
  navigatorLinkRedeemResponseSchema,
  type NavigatorLookupPayload,
  navigatorLookupPayloadSchema,
  type NavigatorLookupResponse,
  navigatorLookupResponseSchema,
} from '../schemata.js';

export class NavigatorClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
  ) {
    super(message);
    this.name = 'NavigatorClientError';
  }
}

const NAVIGATOR_REQUEST_TIMEOUT_MS = 10_000;
const INGESTION_MAX_ATTEMPTS = 3;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, NAVIGATOR_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    logger.error('dependency.navigator.transport_error', { error });
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Navigator request timed out'
        : error instanceof Error
          ? error.message
          : 'Network error';
    throw new NavigatorClientError(message, 502, 'transport_error');
  } finally {
    clearTimeout(timeout);
  }
}

export const navigatorClient = {
  async redeemLinkCode(
    payload: NavigatorLinkRedeemPayload,
  ): Promise<NavigatorLinkRedeemResponse> {
    const validatedPayload = navigatorLinkRedeemPayloadSchema.parse(payload);
    const baseUrl = environment.NAVIGATOR_BASE_URL.replace(/\/+$/, '');
    const url = `${baseUrl}/api/karma/link-redeem`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (environment.KARMA_APP_TOKEN) {
      headers.Authorization = `Bearer ${environment.KARMA_APP_TOKEN}`;
    }

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(validatedPayload),
    });
    logger.info('dependency.navigator.response', {
      operation: 'redeem_link_code',
      status: response.status,
    });

    if (response.ok) {
      const data = await response.json();
      return navigatorLinkRedeemResponseSchema.parse(data);
    }

    let errorData: { error?: string } = {};
    try {
      const data = await response.json();
      errorData = navigatorErrorResponseSchema.parse(data);
    } catch {
      // Ignore JSON parse error
    }

    const errorCode =
      errorData.error ||
      (response.status === 404
        ? 'invalid_or_expired'
        : response.status === 409
          ? 'already_linked'
          : 'navigator_error');
    throw new NavigatorClientError(errorCode, response.status, errorCode);
  },

  async pushIngestBatch(
    payload: NavigatorIngestPayload,
  ): Promise<NavigatorIngestResponse> {
    const validatedPayload = navigatorIngestPayloadSchema.parse(payload);
    const baseUrl = environment.NAVIGATOR_BASE_URL.replace(/\/+$/, '');
    const url = `${baseUrl}/api/karma/ingest`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (environment.KARMA_APP_TOKEN) {
      headers.Authorization = `Bearer ${environment.KARMA_APP_TOKEN}`;
    }

    let response: Response | undefined;
    for (let attempt = 1; attempt <= INGESTION_MAX_ATTEMPTS; attempt += 1) {
      try {
        response = await fetchWithTimeout(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(validatedPayload),
        });
        logger.info('dependency.navigator.response', {
          operation: 'push_ingest_batch',
          attempt,
          status: response.status,
        });
        // eslint-disable-next-line unicorn/prefer-simple-condition-first
        if (response.status < 500 || attempt === INGESTION_MAX_ATTEMPTS) {
          break;
        }
      } catch (error) {
        if (
          !(error instanceof NavigatorClientError) ||
          error.errorCode !== 'transport_error' ||
          // eslint-disable-next-line unicorn/prefer-simple-condition-first
          attempt === INGESTION_MAX_ATTEMPTS
        ) {
          throw error;
        }
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250 * attempt);
      });
    }

    if (!response) {
      throw new NavigatorClientError(
        'Navigator ingestion request failed',
        502,
        'transport_error',
      );
    }

    if (response.ok) {
      const data = await response.json();
      return navigatorIngestResponseSchema.parse(data);
    }

    let errorData: { error?: string } = {};
    try {
      const data = await response.json();
      errorData = navigatorErrorResponseSchema.parse(data);
    } catch {
      // Ignore JSON parse error
    }

    const errorCode = errorData.error || 'navigator_error';
    throw new NavigatorClientError(errorCode, response.status, errorCode);
  },

  async lookupKarma(
    payload: NavigatorLookupPayload,
  ): Promise<NavigatorLookupResponse> {
    const validatedPayload = navigatorLookupPayloadSchema.parse(payload);
    const baseUrl = environment.NAVIGATOR_BASE_URL.replace(/\/+$/, '');
    const url = `${baseUrl}/api/karma/lookup`;

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedPayload),
    });
    logger.info('dependency.navigator.response', {
      operation: 'lookup_karma',
      status: response.status,
    });

    if (response.ok) {
      const data = await response.json();
      return navigatorLookupResponseSchema.parse(data);
    }

    let errorData: { error?: string } = {};
    try {
      const data = await response.json();
      errorData = navigatorErrorResponseSchema.parse(data);
    } catch {
      // Ignore JSON parse error
    }

    const errorCode = errorData.error || 'navigator_error';
    throw new NavigatorClientError(errorCode, response.status, errorCode);
  },
};
