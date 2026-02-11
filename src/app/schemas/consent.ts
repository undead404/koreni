import { z } from 'zod';

export const consentStateSchema = z.object({
  analytics: z.boolean().optional().default(false),
  marketing: z.boolean().optional().default(false),
  necessary: z.boolean().optional().default(true),
});

export type ConsentState = z.infer<typeof consentStateSchema>;
