import { z } from 'zod';

export const searchRequestSchema = z.object({
  q: z.string().min(1),
  query_by: z.string().min(1),
  sort_by: z.string().optional(),
  filter_by: z.string().optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;
