import environment from '@/app/environment';
import { initBugsnag } from '@/app/services/bugsnag';

export class ApiRequestError extends Error {
  public readonly status: number;

  public constructor(status: number) {
    super(`Request failed with HTTP ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export default async function requestApi(
  path: string,
  parameters?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(
      new URL(path, environment.NEXT_PUBLIC_API_SITE),
      {
        credentials: 'include',
        ...parameters,
      },
    );
    if (!response.ok) {
      throw new ApiRequestError(response.status);
    }
    return response;
  } catch (error) {
    initBugsnag().notify(error as Error);
    throw error;
  }
}
