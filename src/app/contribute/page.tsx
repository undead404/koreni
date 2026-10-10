import type { Metadata } from 'next';
import Link from 'next/link';

import Comments from '../components/comments/comments';
import ContributeForm from '../components/contribute/contribute-form';
import knownLocations from '../services/known-locations';

export const metadata: Metadata = {
  title: 'Додавання таблиці', // Automatically compiles to "Додавання таблиці | Корені"
  description: 'Додайте до Коренів власну таблицю індексації.',
  alternates: {
    canonical: '/contribute/',
  },
  authors: [
    {
      name: 'Віталій Перегончук',
      url: 'https://www.linkedin.com/in/vitalii-perehonchuk-10570693/',
    },
  ],
  openGraph: {
    title: 'Додавання таблиці',
    description: 'Додайте до Коренів власну таблицю індексації.',
    url: '/contribute/',
  },
  twitter: {
    title: 'Додавання таблиці',
    description: 'Додайте до Коренів власну таблицю індексації.',
  },
};

export default function ContributePage() {
  return (
    <>
      <aside className="note">
        <p>
          <strong>Рекомендуємо:</strong> перед поданням таблиці ознайомтеся з{' '}
          <Link
            href="/blog/2026-10-10-yaki-tablytsi-pryimaiutsia-na-koreni/"
            target="_blank"
            rel="noopener noreferrer"
          >
            критеріями прийняття таблиць до Коренів
          </Link>
          .
        </p>
      </aside>
      <ContributeForm knownLocations={knownLocations} />
      <Comments />
    </>
  );
}
