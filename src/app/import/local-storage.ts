import { z } from 'zod';

import { initBugsnag } from '../services/bugsnag';

const importStateSchema = z.record(z.string());
const IMPORT_STATE_KEY = 'import_state';

export function restoreImportPageState() {
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
export function resetImportPageState() {
  localStorage.removeItem(IMPORT_STATE_KEY);
}

export function saveImportPageState(data: Record<string, string>) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(IMPORT_STATE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save import state', error);
    initBugsnag().notify(error as Error);
  }
}
