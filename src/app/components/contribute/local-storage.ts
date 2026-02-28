import { z } from 'zod';

import { initBugsnag } from '@/app/services/bugsnag';

const authorIdentitySchema = z.object({
  authorName: z.string().optional(),
  authorEmail: z.string().optional(),
  authorGithubUsername: z.string().optional(),
});
export type AuthorIdentity = z.infer<typeof authorIdentitySchema>;
const importStateSchema = authorIdentitySchema.extend({
  id: z.string().optional(),
  yearStart: z.number().optional(),
  yearEnd: z.number().optional(),
  year: z.number().optional(),
  location: z.string().optional(),
  sources: z.string().optional(),
  title: z.string().optional(),
  tableLocale: z.enum(['ru', 'uk']).optional(),
  archiveItems: z.string().optional(),
});
export type ImportState = z.infer<typeof importStateSchema>;
const IMPORT_STATE_KEY = 'import_state';

export function restoreContributePageState(): ImportState | null {
  try {
    if (globalThis.window === undefined) return null;
    const savedState = localStorage.getItem(IMPORT_STATE_KEY);
    if (!savedState) return null;
    const parsedRaw = JSON.parse(savedState) as unknown;
    const parsed = importStateSchema.parse(parsedRaw);
    return parsed;
  } catch (error) {
    console.error('Failed to restore import state', error);
    initBugsnag().notify(error as Error);
    return null;
  }
}
export function resetContributePageState() {
  localStorage.removeItem(IMPORT_STATE_KEY);
}

export function saveContributePageState(data: ImportState) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(IMPORT_STATE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save import state', error);
    initBugsnag().notify(error as Error);
  }
}

const AUTHOR_IDENTITY_KEY = 'import_author_identity';

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
