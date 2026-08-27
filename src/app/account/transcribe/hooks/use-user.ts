import { useEffect, useState } from 'react';

import getMe from '../api/get-me';
import { type User } from '../schemata';

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
      cachedUserPromise = getMe();
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
