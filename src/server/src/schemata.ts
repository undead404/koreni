import { z } from 'zod';

import { indexationTableSchema } from '../../shared/schemas/indexation-table';

// 1. Схеми (залишаємо як були)
export const importPayloadSchema = indexationTableSchema
  .omit({
    size: true,
    tableFilename: true,
  })
  .extend({
    date: z.coerce
      .string()
      .transform((dateString) => new Date(dateString))
      .refine((date) => !Number.isNaN(date.getTime()), {
        message: 'Invalid date format. Expected ISO string.',
      }),
  });

export type ImportPayload = z.infer<typeof importPayloadSchema>;

export const protectedImportPayloadSchema = importPayloadSchema.extend({
  turnstileToken: z.string().min(1).optional(), // Додаткове поле для токена турнікета
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
