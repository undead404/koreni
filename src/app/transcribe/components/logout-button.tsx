'use client';

import { googleLogout } from '@react-oauth/google';
import { useRouter } from 'next/navigation';

import environment from '@/app/environment';
import { initBugsnag } from '@/app/services/bugsnag';

import styles from './logout-button.module.css';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Sever the local Google Identity SDK state
    googleLogout();

    // 2. Execute backend cookie destruction
    fetch(new URL('/api/auth/me', environment.NEXT_PUBLIC_API_SITE), {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Logout failed');
        }
        router.push('/transcribe/login');
        return;
      })
      .catch((error: unknown) => {
        console.error(error);
        initBugsnag().notify(error as Error);
      });
  };

  return (
    <button onClick={handleLogout} className={styles.root}>
      Sign Out
    </button>
  );
}
