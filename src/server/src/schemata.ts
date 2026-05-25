import { z } from 'zod';

export const nonEmptyString = z.string().min(1);
const yearSchema = z
  .number({
    message: 'Year must be a valid number',
  })
  .min(1500, {
    message: 'Year must be at least 1500',
  })
  .max(2100, {
    message: 'No future dates',
  });
export const importPayloadSchema = z.object({
  archiveItems: z.array(nonEmptyString).min(1),
  authorGithubUsername: z.string().optional(),
  authorName: nonEmptyString,
  authorEmail: z.email(),
  // id may contain letters, numbers and dashes
  id: nonEmptyString.regex(/^[a-z0-9-]+$/i),
  location: z.tuple([
    z.number().min(-90).max(90),
    z.number().min(-180).max(180),
  ]),
  sources: z.array(z.string()),
  table: z.object({
    columns: z.array(nonEmptyString).min(1),
    data: z.array(z.record(z.string(), z.any())).min(1),
  }),
  tableLocale: z.enum(['pl', 'ru', 'uk']),
  title: nonEmptyString,
  yearsRange: z.union([
    z.tuple([z.number(), z.number()]),
    z.tuple([z.number()]),
  ]),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;

export const projectCreatePayloadSchema = z.object({
  id: nonEmptyString.regex(/^[a-z0-9-]+$/i),
  isHandwritten: z.boolean(),
  location: z.tuple(
    [z.number().min(-90).max(90), z.number().min(-180).max(180)],
    {
      message: 'Location must be a valid pair of coordinates',
    },
  ),
  sources: z.array(z.string()),
  tableLocale: z.enum(['pl', 'ru', 'uk']),
  title: nonEmptyString,
  type: z.enum(['table', 'text', 'confession-list', 'parish-register']),
  yearsRange: z.union(
    [z.tuple([yearSchema]), z.tuple([yearSchema, yearSchema])],
    {
      message:
        'Years range must be a valid pair of numbers, or a single number',
    },
  ),
});

export type ProjectCreatePayload = z.infer<typeof projectCreatePayloadSchema>;

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

export const authSchema = z.object({
  credential: z.string(),
});

export const jwtSchema = z.object({
  exp: z.number(),
  iat: z.number(),
  isAdmin: z.boolean().optional().default(false),
  sub: z.string(),
});

export type Jwt = z.infer<typeof jwtSchema>;
