'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import requestApi from '@/app/services/api';

import { type User, userResponseSchema } from '../schemata';

import {
  getLoginRedirectPath,
  RequestGenerationTracker,
} from './account-auth-state';
import LogoutButton from './logout-button';

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' };

export default function UserView() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  const router = useRouter();
  const pathname = usePathname();
  const searchParameters = useSearchParams();
  const trackerReference = useRef(new RequestGenerationTracker());

  useEffect(() => {
    let isMounted = true;
    const tracker = trackerReference.current;
    const generation = tracker.nextGeneration();

    const fetchUser = async () => {
      try {
        const response = await requestApi('/api/auth/me');
        const data: unknown = await response.json();
        if (!isMounted || !tracker.isCurrent(generation)) return;

        const userData = userResponseSchema.parse(data);
        setAuthState({ status: 'authenticated', user: userData.user });
      } catch {
        if (!isMounted || !tracker.isCurrent(generation)) return;

        setAuthState({ status: 'unauthenticated' });
        router.replace(getLoginRedirectPath(pathname, searchParameters));
      }
    };

    void fetchUser();

    return () => {
      isMounted = false;
      tracker.invalidate();
    };
  }, [pathname, router, searchParameters]);

  if (authState.status === 'loading') {
    return <p>Loading...</p>;
  }

  if (authState.status === 'authenticated') {
    return (
      <>
        <p title={`Автентифіковані як: ${authState.user.email}`}>
          {authState.user.email}
        </p>
        <LogoutButton />
      </>
    );
  }

  return null;
}
