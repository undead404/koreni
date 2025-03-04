import { z } from 'zod';

import { nonEmptyString } from './non-empty-string';

export const indexationTableSchema = z.object({
  id: z.number().min(1),
  tableFilename: nonEmptyString,
  location: z.tuple([z.number(), z.number()]),
  size: z.number().min(1),
  sources: z.array(nonEmptyString),
  title: nonEmptyString,
  tableLocale: z.enum(['ru', 'uk']),
});

export type IndexationTable = z.infer<typeof indexationTableSchema>;
