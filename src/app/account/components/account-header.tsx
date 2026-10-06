'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import useSWR from 'swr';
import { z } from 'zod';

import environment from '@/app/environment';
import { nonEmptyString } from '@/shared/schemas/non-empty-string';

import getProject from '../transcribe/api/get-project';

import { isLoginRoute, normalizePathname } from './account-auth-state';
import UserView from './user';

import styles from './account-header.module.css';

import logo from '../../assets/logo.png';

const projectSearchParametersSchema = z.object({
  projectId: nonEmptyString.regex(/^[a-z0-9-]+$/i),
});

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
  const isLoginPage = isLoginRoute(pathname);
  const normalizedPathname = normalizePathname(pathname);
  const projectId =
    normalizedPathname === '/account/transcribe/project'
      ? (projectSearchParametersSchema.safeParse({
          projectId: searchParameters.get('projectId'),
        }).data?.projectId ?? null)
      : null;

  const projectKey = projectId ? `/api/transcribe/projects/${projectId}` : null;
  const { data: projectResponse } = useSWR(
    projectKey,
    projectId ? () => getProject(projectId) : null,
  );

  const projectTitle =
    projectResponse?.project.id === projectId
      ? projectResponse.project.title
      : null;
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
