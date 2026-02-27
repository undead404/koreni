import { z } from 'zod';

export const nonEmptyString = z.string().min(1);
const stringifiedValue = <T>(itemSchema: z.ZodType<T>) =>
  z
    .string()
    .transform((value) => itemSchema.parse(JSON.parse(value) as unknown));
const stringifiedStringArray = stringifiedValue(z.array(z.string()));
const stringifiedLocation = stringifiedValue(z.tuple([z.number(), z.number()]));
export const importPayloadSchema = z.object({
  archiveItems: stringifiedValue(z.array(nonEmptyString).min(1)),
  authorGithubUsername: z.string().optional(),
  authorName: nonEmptyString,
  authorEmail: z.string().email(),
  // id may contain letters, numbers and dashes
  id: nonEmptyString.regex(/^[a-z0-9-]+$/i),
  location: stringifiedLocation,
  sources: stringifiedStringArray,
  table: z.instanceof(File),
  tableLocale: z.enum(['ru', 'uk']),
  title: nonEmptyString,
  yearsRange: stringifiedValue(z.array(z.number()).min(1).max(2)),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;

export const turnstilePayloadSchema = z.object({
  turnstileToken: nonEmptyString.optional(),
});
export const turnstileResponseSchema = z.object({
  success: z.boolean(),
  challenge_ts: z.string().optional(),
  hostname: z.string().optional(),
  'error-codes': z.array(z.string()).optional(),
});

export type TurnstileResponse = z.infer<typeof turnstileResponseSchema>;
