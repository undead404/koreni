import { verify } from 'hono/jwt';

import environment from '../environment.js';
import { jwtSchema } from '../schemata.js';

export default async function verifyToken(token: string) {
  const rawPayload = await verify(token, environment.JWT_SECRET, 'HS256');
  return jwtSchema.parse(rawPayload);
}
