import { z } from 'zod';

import { initBugsnag } from '../services/bugsnag';

const importStateSchema = z.record(z.string());
const IMPORT_STATE_KEY = 'import_state';

export function restoreContributePageState() {
  try {
    const savedState = localStorage.getItem(IMPORT_STATE_KEY);
    if (!savedState) return;
    const parsedRaw = JSON.parse(savedState) as unknown;
    const parsed = importStateSchema.parse(parsedRaw);
    return parsed;
  } catch (error) {
    console.error('Failed to restore import state', error);
    initBugsnag().notify(error as Error);
    return;
  }
}
export function resetContributePageState() {
  localStorage.removeItem(IMPORT_STATE_KEY);
}

export function saveContributePageState(data: Record<string, string>) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(IMPORT_STATE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save import state', error);
    initBugsnag().notify(error as Error);
  }
}

const AUTHOR_IDENTITY_KEY = 'import_author_identity';

export function restoreAuthorIdentity() {
  try {
    const savedState = localStorage.getItem(AUTHOR_IDENTITY_KEY);
    if (!savedState) return {};
    const parsedRaw = JSON.parse(savedState) as unknown;
    const parsed = importStateSchema.parse(parsedRaw);
    return parsed;
  } catch (error) {
    console.error('Failed to restore author identity', error);
    return {};
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
