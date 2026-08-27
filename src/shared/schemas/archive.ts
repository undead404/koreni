import { z } from 'zod';

import { nonEmptyString } from './non-empty-string';

export const archiveSchema = z.object({
  shortTitle: nonEmptyString,
  title: nonEmptyString,
  website: z.url().nullish(),
  wikidataId: z.string().regex(/^Q\d+$/),
});

export type Archive = z.infer<typeof archiveSchema>;
