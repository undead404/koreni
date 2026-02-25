import { z } from 'zod';

export const searchParametersSchema = z.object({
  matchedTokens: z.string().nullable(),
  showRow: z.string().nullable(),
});

export type SearchParametersHack = z.infer<typeof searchParametersSchema>;
