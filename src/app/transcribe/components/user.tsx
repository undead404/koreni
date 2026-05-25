'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useUser } from '../hooks/use-user';

export default function UserView() {
  const { user, loading, error } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (error || !user)) {
      router.push('/transcribe/login');
    }
  }, [loading, error, user, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return user ? (
    <p title={`Authenticated as: ${user.email}`}>{user.email}</p>
  ) : null;
}
