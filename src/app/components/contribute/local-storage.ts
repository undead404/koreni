import { initBugsnag } from '@/app/services/bugsnag';

import {
  AuthorIdentity,
  authorIdentitySchema,
  RestorableState,
  restorableStateSchema,
} from './schemata';

const CONTRIBUTE_STATE_KEY = 'contribute_state';

export function restoreContributePageState(): RestorableState | null {
  try {
    if (globalThis.window === undefined) return null;
    const savedState = localStorage.getItem(CONTRIBUTE_STATE_KEY);
    if (!savedState) return null;
    const parsedRaw = JSON.parse(savedState) as unknown;
    const parsed = restorableStateSchema.parse(parsedRaw);
    return parsed;
  } catch (error) {
    console.error('Failed to restore contribute state', error);
    resetContributePageState();
    initBugsnag().notify(error as Error);
    return null;
  }
}

export function resetContributePageState() {
  localStorage.removeItem(CONTRIBUTE_STATE_KEY);
}

export function saveContributePageState(data: RestorableState) {
  try {
    const serialized = JSON.stringify(
      { ...data, table: undefined },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      (key, value) => value || undefined,
    );
    localStorage.setItem(CONTRIBUTE_STATE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save contribute state', error);
    initBugsnag().notify(error as Error);
  }
}

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

    initBugsnag().notify(error as Error);
  }
}
