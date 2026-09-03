import { z } from 'zod';

export const nonEmptyString = z.string().min(1);
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
  location: z.tuple([
    z.number().min(-90).max(90),
    z.number().min(-180).max(180),
  ]),
  sources: z.array(z.string()),
  tableLocale: z.enum(['pl', 'ru', 'uk']),
  title: nonEmptyString,
  type: z.string().optional(),
  yearsRange: z.union([
    z.tuple([z.number(), z.number()]),
    z.tuple([z.number()]),
  ]),
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
  v: z.number(),
});

export type Jwt = z.infer<typeof jwtSchema>;

export const karmaLinkedUserSchema = z.object({
  contribution_email: z.email().nullable().optional(),
  email: z.email(),
  karma_linked_at: z.string(),
});

export const karmaLinkedUsersResponseSchema = z.object({
  users: z.array(karmaLinkedUserSchema),
});

export type KarmaLinkedUser = z.infer<typeof karmaLinkedUserSchema>;
export type KarmaLinkedUsersResponse = z.infer<
  typeof karmaLinkedUsersResponseSchema
>;

export const navigatorLinkRedeemPayloadSchema = z.object({
  code: z.string().min(1),
  login: z.email(),
  total: z.number().int().nonnegative().optional(),
});

export type NavigatorLinkRedeemPayload = z.infer<
  typeof navigatorLinkRedeemPayloadSchema
>;

export const navigatorLinkRedeemResponseSchema = z.object({
  ok: z.literal(true),
  awarded: z.number().int().nonnegative(),
});

export type NavigatorLinkRedeemResponse = z.infer<
  typeof navigatorLinkRedeemResponseSchema
>;

export const navigatorIngestPayloadSchema = z.object({
  accounts: z.array(
    z.object({
      login: z.email(),
      total: z.number().int().nonnegative(),
    }),
  ),
});

export type NavigatorIngestPayload = z.infer<
  typeof navigatorIngestPayloadSchema
>;

export const navigatorIngestResponseSchema = z.object({
  synced: z.number().int().nonnegative(),
  awarded: z.number().int().nonnegative(),
  unknown: z.array(z.string()),
});

export type NavigatorIngestResponse = z.infer<
  typeof navigatorIngestResponseSchema
>;

export const navigatorErrorResponseSchema = z.object({
  error: z.string(),
});

export type NavigatorErrorResponse = z.infer<
  typeof navigatorErrorResponseSchema
>;

export const navigatorLookupPayloadSchema = z.object({
  service: nonEmptyString,
  users: z.array(z.string()),
});

export type NavigatorLookupPayload = z.infer<
  typeof navigatorLookupPayloadSchema
>;

export const navigatorLookupResultItemSchema = z.object({
  user: z.string(),
  found: z.boolean(),
  serviceKarma: z.number().int().nonnegative(),
  totalKarma: z.number().int().nonnegative(),
});

export type NavigatorLookupResultItem = z.infer<
  typeof navigatorLookupResultItemSchema
>;

export const navigatorLookupResponseSchema = z.object({
  service: z.string(),
  name: z.string(),
  results: z.array(navigatorLookupResultItemSchema),
});

export type NavigatorLookupResponse = z.infer<
  typeof navigatorLookupResponseSchema
>;

export const karmaStatusResponseSchema = z.object({
  tables: z.number().int().nonnegative(),
  rows: z.number().int().nonnegative(),
  user: z.object({
    email: z.email(),
    karma_linked_at: z.string().nullable(),
  }),
});

export type KarmaStatusResponse = z.infer<typeof karmaStatusResponseSchema>;

export const karmaLookupResponseSchema = z.object({
  found: z.boolean(),
  serviceKarma: z.number().int().nonnegative(),
  totalKarma: z.number().int().nonnegative(),
});

export type KarmaLookupResponse = z.infer<typeof karmaLookupResponseSchema>;
