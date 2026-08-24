'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

import environment from '@/app/environment';

import { isLoginRoute, normalizePathname } from './account-auth-state';
import UserView from './user';

import styles from './account-header.module.css';

interface BreadcrumbItem {
  href?: string;
  label: string;
}

function getBreadcrumbItems(pathname: string | null): BreadcrumbItem[] {
  const normalizedPathname = normalizePathname(pathname);
  const accountItems: BreadcrumbItem[] = [
    { href: '/', label: 'Головна' },
    { href: '/account', label: 'Кабінет' },
  ];

  switch (normalizedPathname) {
    case '/account/login': {
      return [...accountItems, { label: 'Вхід' }];
    }
    case '/account/karma': {
      return [...accountItems, { label: 'Карма' }];
    }
    case '/account/transcribe': {
      if (!environment.NEXT_PUBLIC_ENABLE_TRANSCRIBE) return accountItems;
      return [...accountItems, { label: 'Транскрипція' }];
    }
    case '/account/transcribe/create': {
      if (!environment.NEXT_PUBLIC_ENABLE_TRANSCRIBE) return accountItems;
      return [
        ...accountItems,
        { href: '/account/transcribe', label: 'Транскрипція' },
        { label: 'Створення проєкту' },
      ];
    }
    default: {
      return accountItems;
    }
  }
}

export default function AccountHeader() {
  const pathname = usePathname();
  const isLoginPage = isLoginRoute(pathname);
  const breadcrumbItems = getBreadcrumbItems(pathname);

  return (
    <div className={styles.root}>
      <nav aria-label="Навігація кабінету" className={styles.navigation}>
        <ol className={styles.breadcrumbs}>
          {breadcrumbItems.map((item, index) => {
            const isCurrent = index === breadcrumbItems.length - 1;

            return (
              <li className={styles.item} key={item.label}>
                {item.href && !isCurrent ? (
                  <Link className={styles.link} href={item.href}>
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isCurrent ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {!isLoginPage && (
        <Suspense fallback={null}>
          <UserView />
        </Suspense>
      )}
    </div>
  );
}
