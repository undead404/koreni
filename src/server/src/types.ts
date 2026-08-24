import type { Context } from 'hono';
export type ContextVariables = {
  isAdmin: boolean;
  userId: string;
  requestId: string;
};

export type TranscribeContext = Context<{ Variables: ContextVariables }>;
