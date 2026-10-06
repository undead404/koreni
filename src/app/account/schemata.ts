import z from 'zod';

export const userSchema = z.object({
  email: z.string(),
  id: z.string(),
});

export const userResponseSchema = z.object({
  user: userSchema,
});

export type User = z.infer<typeof userSchema>;

export const emailVisibilitySchema = z.strictObject({
  show_email: z.boolean(),
});

export const emailVisibilityUpdateResponseSchema = z.strictObject({
  rebuild_status: z.enum(['queued', 'dispatch_failed']),
  show_email: z.boolean(),
});

export const emailVisibilityPolicyResponseSchema = z.strictObject({
  suppressed_emails: z.array(z.string()),
});

export const emailVisibilityPolicyManifestSchema = z.discriminatedUnion(
  'mode',
  [
    z.strictObject({ mode: z.literal('all') }),
    z.strictObject({
      mode: z.literal('listed'),
      suppressed_emails: z.array(z.email()),
    }),
  ],
);

export type EmailVisibility = z.infer<typeof emailVisibilitySchema>;
export type EmailVisibilityUpdateResponse = z.infer<
  typeof emailVisibilityUpdateResponseSchema
>;
export type EmailVisibilityPolicyManifest = z.infer<
  typeof emailVisibilityPolicyManifestSchema
>;

export const projectSchema = z.object({
  created_at: z.string(),
  id: z.string(),
  title: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

export const projectResponseSchema = z.object({
  projects: z.array(projectSchema),
});
