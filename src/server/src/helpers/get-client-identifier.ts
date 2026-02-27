import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';

const getClientIdentifier = (c: Context, apiKey?: string): string => {
  if (apiKey) {
    return `api_key_${apiKey.slice(0, 8)}`;
  }
  const info = getConnInfo(c);
  return (
    (c.req.header('x-forwarded-for') as string) ||
    info.remote.address ||
    'unknown'
  );
};
export default getClientIdentifier;
