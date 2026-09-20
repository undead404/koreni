'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

import environment from '@/app/environment';

import { isLoginRoute, normalizePathname } from './account-auth-state';
import UserView from './user';

import styles from './account-header.module.css';

import logo from '../../assets/logo.png';

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
    <header className={styles.root}>
      <div className={styles.brandGroup}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src={logo}
            alt="Логотип Коренів"
            className="filter-inverted"
            width={44}
            height={44}
          />
        </Link>
        <Link href="/" className={styles.searchLink}>
          Пошук
        </Link>
      </div>
      <nav aria-label="Навігація кабінету" className={styles.navigation}>
        <ol className={styles.breadcrumbs}>
          {breadcrumbItems.map((item, index) => {
            const isCurrent = index === breadcrumbItems.length - 1;

            return (
              <li className={styles.item} key={item.label}>
                {!isCurrent && item.href ? (
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
        <div className={styles.userControls}>
          <Suspense fallback={null}>
            <UserView />
          </Suspense>
        </div>
      )}
    </header>
  );
}
