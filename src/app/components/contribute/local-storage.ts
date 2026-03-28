import posthog from 'posthog-js';

import { initBugsnag } from '@/app/services/bugsnag';

import { type AuthorIdentity, authorIdentitySchema } from './schema';

const AUTHOR_IDENTITY_KEY = 'contribute_author_identity';

export function restoreAuthorIdentity(): AuthorIdentity | null {
  try {
    if (globalThis.window === undefined) return null;
    const savedState = localStorage.getItem(AUTHOR_IDENTITY_KEY);
    if (!savedState) return null;
    const parsedRaw = JSON.parse(savedState) as unknown;
    const parsed = authorIdentitySchema.parse(parsedRaw);
    return parsed;
  } catch (error) {
    console.error('Failed to restore author identity', error);
    posthog.capture('author_identity_restore_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    initBugsnag().notify(error as Error);
    localStorage.removeItem(AUTHOR_IDENTITY_KEY);
    return null;
  }
}

export function saveAuthorIdentity(data: Record<string, string>) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(AUTHOR_IDENTITY_KEY, serialized);
  } catch (error) {
    console.error('Failed to save author identity', error);
    posthog.capture('author_identity_save_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    initBugsnag().notify(error as Error);
  }
}
