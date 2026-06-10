import requestApi from './request';

export default function authGoogle(credential: string | undefined) {
  return requestApi('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential: credential }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
