import { z } from 'zod';

import { nonEmptyString } from '../shared/schemas/non-empty-string';

export const typesenseHealthcheckResponseSchema = z.object({
  ok: z.boolean(),
});

export const typesenseKeysPostResponseSchema = z.object({
  data: z.object({
    value: nonEmptyString,
  }),
});
