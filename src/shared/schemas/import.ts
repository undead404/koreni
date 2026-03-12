import { z } from 'zod';

import { indexationTableSchema } from './indexation-table';

// 1. Схеми (залишаємо як були)
export const importPayloadSchema = indexationTableSchema
  .omit({
    date: true,
    size: true,
    tableFilePath: true,
  })
  .extend({
    authorGithubUsername: z.string().optional(),
    table: z.object({
      columns: z.array(z.string()),
      data: z.array(z.record(z.string(), z.any())),
    }),
    turnstileToken: z.optional(z.string()),
  });

export type ImportPayload = z.infer<typeof importPayloadSchema>;
