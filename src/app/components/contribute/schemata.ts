import { z } from 'zod';

export const authorIdentitySchema = z.object({
  authorName: z.string(),
  authorEmail: z.string().optional(),
  authorGithubUsername: z.string().optional(),
});
export type AuthorIdentity = z.infer<typeof authorIdentitySchema>;
export const contributeStateSchema = authorIdentitySchema.extend({
  table: z.instanceof(File),
  id: z.string(),
  yearStart: z.number().optional(),
  yearEnd: z.number().optional(),
  year: z.number().optional(),
  location: z.string().optional(),
  sources: z
    .array(
      z.object({ url: z.string().url({ message: 'Неправильний формат URL' }) }),
    )
    .optional(),
  title: z.string().optional(),
  tableLocale: z.enum(['pl', 'ru', 'uk']).optional(),
  archiveItems: z.array(z.object({ item: z.string() })).optional(),
});
export type ContributeState = z.infer<typeof contributeStateSchema>;

export const restorableStateSchema = contributeStateSchema
  .partial()
  .omit({
    archiveItems: true,
    table: true,
    sources: true,
  })
  .extend({
    archiveItems: z.array(z.object({ item: z.string().optional() })).optional(),
    sources: z.array(z.object({ url: z.string().optional() })).optional(),
  });

export type RestorableState = z.infer<typeof restorableStateSchema>;
