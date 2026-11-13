import { z } from 'zod';

export const submitErrorSchema = z.object({
  error: z.string(),
});

export const submitResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  url: z.string(),
});

export const idAvailabilityResponseSchema = z.object({
  id: z
    .string()
    .min(5)
    .max(128)
    .regex(/^[a-z0-9-]+$/i),
  available: z.boolean(),
});
export type IdAvailabilityResponse = z.infer<
  typeof idAvailabilityResponseSchema
>;
