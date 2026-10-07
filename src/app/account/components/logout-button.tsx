'use client';

import { googleLogout } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useUnsavedChanges } from '@/app/hooks/use-unsaved-changes';
import requestApi from '@/app/services/api';

import styles from './logout-button.module.css';

export default function LogoutButton() {
  const router = useRouter();
  const { confirmNavigation } = useUnsavedChanges(false);

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
    if (!confirmNavigation()) return;
    void logout();
  };

  return (
    <button className={styles.root} onClick={handleLogout} type="button">
      Log Out
    </button>
  );
}
