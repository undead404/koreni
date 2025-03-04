import { z } from 'zod';

import { nonEmptyString } from '@/shared/schemas/non-empty-string';

const highlightSchema = z.object({
  data: z
    .record(
      z.object({
        snippet: z.string(),
        matched_tokens: z.array(z.string()),
      }),
    )
    .optional(),
});

const resultSchema = z.object({
  document: z.object({
    id: nonEmptyString,
    tableId: z.number(),
    title: nonEmptyString,
  }),
  highlight: highlightSchema,
  text_match_info: z.object({
    best_field_score: nonEmptyString,
  }),
});

export type SearchResultRow = z.infer<typeof resultSchema>;

export default resultSchema;
