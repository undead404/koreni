import environment from '../environment.js';
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

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(validatedPayload),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      throw new NavigatorClientError(message, 502, 'transport_error');
    }

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

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(validatedPayload),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      throw new NavigatorClientError(message, 502, 'transport_error');
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

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedPayload),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      throw new NavigatorClientError(message, 502, 'transport_error');
    }

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
