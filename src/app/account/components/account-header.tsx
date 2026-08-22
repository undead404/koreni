'use client';

import { usePathname } from 'next/navigation';

import { isLoginRoute } from './account-auth-state';
import UserView from './user';

import styles from './account-header.module.css';

export default function AccountHeader() {
  const pathname = usePathname();
  const isLoginPage = isLoginRoute(pathname);

  return (
    <div className={styles.root}>
      <p>Authentication</p>
      {!isLoginPage && <UserView />}
    </div>
  );
}
