import type { Context } from 'hono';
export type ContextVariables = {
  isAdmin: boolean;
  userId: string;
};

export type TranscribeContext = Context<{ Variables: ContextVariables }>;
