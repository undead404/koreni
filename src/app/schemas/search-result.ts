import { z } from 'zod';

import { nonEmptyString } from '@/shared/schemas/non-empty-string';

// Plural 'highlights' used for safe token extraction without dangerouslySetInnerHTML
const highlightsArraySchema = z.array(
  z.object({
    field: z.string().optional(),
    matched_tokens: z.array(z.array(z.string())),
    snippets: z.array(z.string()).optional(),
  }),
);

// Singular 'highlight' retained for backward compatibility if needed elsewhere
const highlightSchema = z.object({
  values: z
    .array(
      z.object({
        snippet: z.string(),
        matched_tokens: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

const resultSchema = z.object({
  document: z
    .object({
      id: nonEmptyString,
      tableId: nonEmptyString,
      title: nonEmptyString,
      // Archival years are notoriously missing; must be optional/nullable
      year: z.number().optional(),
      // Captures the ambiguous archival data safely
      raw: z.record(z.string(), z.unknown()).default({}),
    })
    .loose(), // Prevents schema from stripping unknown adjacent keys like 'location'

  highlight: highlightSchema.optional(),
  highlights: highlightsArraySchema.optional(),

  // Relaxed validation on unused UI metadata to prevent brittle failures
  text_match_info: z.object({
    typo_prefix_score: z.number().optional(),
  }),
});

export type SearchResultRow = z.infer<typeof resultSchema>;

export default resultSchema;
