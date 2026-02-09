import { z } from 'zod';

import { indexationTableSchema } from './indexation-table';

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
    records: z.array(z.record(z.string(), z.unknown())), // Дозволяємо будь-які значення в записах
  });

export type ImportPayload = z.infer<typeof importPayloadSchema>;
