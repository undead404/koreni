'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import environment from '../../environment';
import { type User, userResponseSchema } from '../schemata';

export default function UserView() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(new URL('/api/auth/me', environment.NEXT_PUBLIC_API_SITE), {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        const userData = userResponseSchema.parse(data);
        setUser(userData.user);
        return;
      })
      .catch((error: unknown) => {
        console.error(error);
        router.push('/transcribe/login');
      });
  }, [router]);

  return user ? (
    <p title={`Authenticated as: ${user.email}`}>{user.email}</p>
  ) : (
    <p>Loading...</p>
  );
}
