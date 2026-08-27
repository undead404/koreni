'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import requestApi from '@/app/services/api';

import { type User, userResponseSchema } from './schemata';

import styles from './page.module.css';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await requestApi('/api/auth/me');
        const data: unknown = await response.json();
        const userData = userResponseSchema.parse(data);
        setUser(userData.user);
      } catch {
        router.replace('/account/login');
      }
    };
    void loadUser();
  }, [router]);

  if (!user) {
    return (
      <main className={styles.root}>
        <p role="status">Завантаження кабінету...</p>
      </main>
    );
  }

  return (
    <main className={styles.root}>
      <section className={styles.card} aria-labelledby="account-title">
        <h1 id="account-title">Ваш кабінет</h1>
        <p className={styles.identity}>Ви увійшли як {user.email}</p>
        <p className={styles.description}>
          Тут можна переглянути стан карми та прив&apos;язати акаунт до
          Генеалогічного навігатора.
        </p>
        <Link href="/account/karma">
          Переглянути карму та прив&apos;язати акаунт
        </Link>
      </section>
    </main>
  );
}
