'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import requestApi from '@/app/services/api';

import { type User, userResponseSchema } from './schemata';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    requestApi('/api/auth/me')
      .then((response) => response.json())
      .then((data) => {
        const userData = userResponseSchema.parse(data);
        setUser(userData.user);
        return;
      })
      .catch(() => {
        router.replace('/account/login');
      });
  }, [router]);

  if (!user) {
    return <p>Loading account...</p>;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Account Overview</h1>
      <p>Authenticated as: {user.email}</p>
      <p>
        <Link href="/account/karma">
          Переглянути карму та прив&apos;язати акаунт
        </Link>
      </p>
    </main>
  );
}
