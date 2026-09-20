'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import environment from '@/app/environment';

import getProject from '../transcribe/api/get-project';

import { isLoginRoute, normalizePathname } from './account-auth-state';
import UserView from './user';

import styles from './account-header.module.css';

import logo from '../../assets/logo.png';

interface BreadcrumbItem {
  href?: string;
  label: string;
}

function getBreadcrumbItems(
  pathname: string | null,
  projectTitle: string | null,
): BreadcrumbItem[] {
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
      return [...accountItems, { label: 'Транскрибування' }];
    }
    case '/account/transcribe/project': {
      if (!environment.NEXT_PUBLIC_ENABLE_TRANSCRIBE) return accountItems;
      return [
        ...accountItems,
        { label: `Транскрибування${projectTitle ? ` ${projectTitle}` : ''}` },
      ];
    }
    case '/account/transcribe/create': {
      if (!environment.NEXT_PUBLIC_ENABLE_TRANSCRIBE) return accountItems;
      return [
        ...accountItems,
        { href: '/account/transcribe', label: 'Транскрибування' },
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
  const searchParameters = useSearchParams();
  const [project, setProject] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const isLoginPage = isLoginRoute(pathname);
  const normalizedPathname = normalizePathname(pathname);
  const projectId =
    normalizedPathname === '/account/transcribe/project'
      ? searchParameters.get('projectId')
      : null;

  useEffect(() => {
    if (!projectId) return;

    const abortController = new AbortController();
    const loadProject = async () => {
      try {
        const data = await getProject(projectId, abortController.signal);
        if (!abortController.signal.aborted) {
          setProject({ id: projectId, title: data.project.title });
        }
      } catch {
        // The project page handles request errors separately.
      }
    };

    void loadProject();

    return () => {
      abortController.abort();
    };
  }, [projectId]);

  const projectTitle = project?.id === projectId ? project.title : null;
  const breadcrumbItems = getBreadcrumbItems(pathname, projectTitle);

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
