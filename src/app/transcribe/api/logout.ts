import requestApi from './request';

export default function logout() {
  return requestApi('/api/auth/me', {
    method: 'DELETE',
  });
}
