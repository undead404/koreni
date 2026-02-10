import { z } from 'zod';

import { importPayloadSchema } from '../../shared/schemas/import';

export const protectedImportPayloadSchema = importPayloadSchema.extend({
  secret: z.string().min(1), // Додаткове поле для секретного ключа
  turnstileToken: z.string().min(1), // Додаткове поле для токена турнікета
});

export type ProtectedImportPayload = z.infer<
  typeof protectedImportPayloadSchema
>;
export const turnstileResponseSchema = z.object({
  success: z.boolean(),
  challenge_ts: z.string().optional(),
  hostname: z.string().optional(),
  'error-codes': z.array(z.string()).optional(),
});

export type TurnstileResponse = z.infer<typeof turnstileResponseSchema>;
