import z from 'zod';

export const userSchema = z.object({
  email: z.string(),
  id: z.string(),
});

export const userResponseSchema = z.object({
  user: userSchema,
});

export type User = z.infer<typeof userSchema>;
