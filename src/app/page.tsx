import _ from 'lodash';
import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import getTablesMetadata from '@/shared/get-tables-metadata';

import Comments from './components/comments';
import Loader from './components/loader';
import Search from './components/search';
import environment from './environment';
import JsonLdHome from './index-json-ld';

import styles from './page.module.css';

export const metadata: Metadata = {
  alternates: {
    canonical: `${environment.NEXT_PUBLIC_SITE}/`,
  },
  applicationName: 'Корені',
  authors: [
    {
      name: 'Аліна Лістунова',
      url: 'https://www.linkedin.com/in/alina-listunova/',
    },
    {
      name: 'Віталій Перегончук',
      url: 'https://www.linkedin.com/in/vitalii-perehonchuk-10570693/',
    },
  ],
  creator: 'Віталій Перегончук',
  description: 'Корені – пошук у народних генеалогічних індексах',
  generator: 'Next.js',
  keywords: [
    'Корені',
    'генеалогія',
    'українська генеалогія',
    'родовід',
    'проєкт',
  ],
  openGraph: {
    description: 'Корені – пошук у народних генеалогічних індексах',
    locale: 'uk-UA',
    siteName: 'Корені',
    title: 'Корені',
    type: 'website',
    url: `${environment.NEXT_PUBLIC_SITE}/`,
  },
  title: 'Корені',
  twitter: {
    card: 'summary_large_image',
    creator: '@negativo_ua',
    description: 'Корені – пошук у народних генеалогічних індексах',
    images: [`${environment.NEXT_PUBLIC_SITE}/icon.png`],
  },
};

export default async function Home() {
  const tablesMetadata = await getTablesMetadata();
  const recordsNumber = _.sumBy(tablesMetadata, 'size');

  return (
    <>
      <h1 className={styles.title}>Корені</h1>
      <p className={styles.description}>
        Неструктуровані генеалогічні індекси, зібрані з{' '}
        <Link href="/tables">
          {tablesMetadata.length}{' '}
          {String(tablesMetadata.length).endsWith('1')
            ? 'різної таблиці'
            : 'різних таблиць'}
        </Link>{' '}
        у пошуковому рушії. Можливо, десь тут є і твої корені?
      </p>
      <Suspense fallback={<Loader />}>
        <Search recordsNumber={recordsNumber} />
      </Suspense>
      <Comments />
      <JsonLdHome tablesMetadata={tablesMetadata} />
    </>
  );
}
