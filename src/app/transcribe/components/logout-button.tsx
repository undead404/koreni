'use client';

import { googleLogout } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import requestApi from '../services/api';

import styles from './logout-button.module.css';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Sever the local Google Identity SDK state
    googleLogout();

    // 2. Execute backend cookie destruction
    requestApi('/api/auth/session/current', {
      method: 'DELETE',
    })
      .then(() => {
        router.push('/transcribe/login');
        return;
      })
      .catch(() => {
        toast.error('Failed to log out');
      });
  };

  return (
    <button onClick={handleLogout} className={styles.root}>
      Log Out
    </button>
  );
}
