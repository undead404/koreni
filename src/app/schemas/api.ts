import { z } from 'zod';

export const submitErrorSchema = z.object({
  error: z.string(),
});

export const submitResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  url: z.string(),
});
