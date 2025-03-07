import * as crypto from 'node:crypto';

export default function generateKey(): string {
  return crypto.randomBytes(16).toString('hex');
}
