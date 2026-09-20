'use client';

import { googleLogout } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import requestApi from '@/app/services/api';

import styles from './logout-button.module.css';

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    // 1. Sever the local Google Identity SDK state
    googleLogout();

    // 2. Execute backend cookie destruction
    try {
      await requestApi('/api/auth/session/current', { method: 'DELETE' });
      router.replace('/account/login');
    } catch {
      toast.error('Failed to log out');
    }
  };
  const handleLogout = () => {
    void logout();
  };

  return (
    <button className={styles.root} onClick={handleLogout}>
      Log Out
    </button>
  );
}
