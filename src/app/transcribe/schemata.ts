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

export const projectImageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  storageKey: z.string(),
  pageSequence: z.number(),
  pageName: z.string().nullable().optional(),
  height: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  createdAt: z.number().nullable().optional(),
  blurhash: z.string().nullable().optional(),
});

export type ProjectImage = z.infer<typeof projectImageSchema>;

export const projectImagesResponseSchema = z.object({
  success: z.boolean(),
  images: z.array(projectImageSchema),
});
