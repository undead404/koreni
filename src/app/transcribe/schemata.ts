import z from 'zod';

export const userSchema = z.object({
  email: z.string(),
  id: z.string(),
});

export const userResponseSchema = z.object({
  user: userSchema,
});

export type User = z.infer<typeof userSchema>;

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  created_at: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

export const projectResponseSchema = z.object({
  projects: z.array(projectSchema),
});
