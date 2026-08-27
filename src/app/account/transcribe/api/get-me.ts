import { userResponseSchema } from '../schemata';

import requestApi from './request';

export default async function getMe() {
  try {
    const response = await requestApi('/api/auth/me');

    if (!response.ok) {
      return null;
    }
    const data: unknown = await response.json();
    const userData = userResponseSchema.parse(data);
    return userData.user;
  } catch (error_: unknown) {
    // eslint-disable-next-line no-console
    console.error(error_);
    return null;
  }
}
