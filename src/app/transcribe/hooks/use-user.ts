import { useEffect, useState } from 'react';

import { type User, userResponseSchema } from '../schemata';
import requestApi from '../services/api';

let cachedUserPromise: Promise<User | null> | null = null;

export function clearUserCache() {
  cachedUserPromise = null;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!cachedUserPromise) {
      cachedUserPromise = requestApi('/api/auth/me')
        .then(async (response) => {
          if (!response.ok) {
            return null;
          }
          const data = await response.json();
          const userData = userResponseSchema.parse(data);
          return userData.user;
        })
        .catch((error_: unknown) => {
          // eslint-disable-next-line no-console
          console.error(error_);
          return null;
        });
    }

    cachedUserPromise
      .then((u) => {
        setUser(u);
        if (!u) {
          setError(new Error('Not authenticated'));
        }
        setLoading(false);
        return null;
      })
      .catch((error_: unknown) => {
        setError(error_ instanceof Error ? error_ : new Error(String(error_)));
        setLoading(false);
        return null;
      });
  }, []);

  return { user, loading, error };
}
