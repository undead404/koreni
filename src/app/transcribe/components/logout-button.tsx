'use client';

import { googleLogout } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import logout from '../api/logout';
import { clearUserCache, useUser } from '../hooks/use-user';

import styles from './logout-button.module.css';

export default function LogoutButton() {
  const router = useRouter();
  const { user, loading } = useUser();

  const handleLogout = () => {
    // 1. Sever the local Google Identity SDK state
    googleLogout();

    // 2. Execute backend cookie destruction
    logout()
      .then(() => {
        clearUserCache();
        router.push('/transcribe/login');
        return;
      })
      .catch(() => {
        toast.error('Failed to sign out');
      });
  };

  if (loading || !user) {
    return null;
  }

  return (
    <button onClick={handleLogout} className={styles.root}>
      Sign Out
    </button>
  );
}
