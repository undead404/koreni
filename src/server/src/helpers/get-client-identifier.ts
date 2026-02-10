import type { Request } from 'express';

const getClientIdentifier = (request: Request, apiKey?: string): string => {
  if (apiKey) {
    return `api_key_${apiKey.slice(0, 8)}`;
  }
  return (
    (request.headers['x-forwarded-for'] as string) ||
    request.socket.remoteAddress ||
    'unknown'
  );
};
export default getClientIdentifier;
