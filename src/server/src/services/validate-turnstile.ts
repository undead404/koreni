import environment from '../environment';
import { turnstileResponseSchema } from '../schemata';

export default async function validateTurnstile(ip: string, token: string) {
  const formData = new FormData();
  formData.append('secret', environment.TURNSTILE_SECRET_KEY);
  formData.append('response', token || '');
  formData.append('remoteip', ip);

  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const result = await fetch(url, { body: formData, method: 'POST' });
  const outcome = await result.json();
  const outcomeData = turnstileResponseSchema.parse(outcome);
  return outcomeData;
}
