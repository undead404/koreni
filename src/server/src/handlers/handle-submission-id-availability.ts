import type { Context } from 'hono';

import { submissionIdAvailabilityQuerySchema } from '../schemata.js';
import { checkSubmissionIdAvailability } from '../services/submission-id-availability.js';

export default async function handleSubmissionIdAvailability(c: Context) {
  c.header('Cache-Control', 'no-store');
  const ids = c.req.queries('id');
  const parsed = submissionIdAvailabilityQuerySchema.safeParse({
    id: ids?.length === 1 ? ids[0] : undefined,
  });
  if (!parsed.success) return c.json({ error: 'invalid_id' }, 400);
  const { id } = parsed.data;
  const available = await checkSubmissionIdAvailability(id);
  if (available === null)
    return c.json({ error: 'availability_unavailable' }, 503);
  return c.json({ id, available });
}
