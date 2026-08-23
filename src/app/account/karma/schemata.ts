import { z } from 'zod';

export const karmaStatusResponseSchema = z.object({
  tables: z.number().int().nonnegative(),
  rows: z.number().int().nonnegative(),
  user: z.object({
    email: z.email(),
    karma_linked_at: z.string().nullable(),
  }),
});

export type KarmaStatus = z.infer<typeof karmaStatusResponseSchema>;

export const karmaLinkResponseSchema = z.object({
  awarded: z.number().int().nonnegative(),
  ok: z.literal(true),
});
