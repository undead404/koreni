import type { Metadata } from 'next';

import Comments from '../components/comments/comments';
import ContributeForm from '../components/contribute/contribute-form';
import knownLocations from '../services/known-locations';

export const metadata: Metadata = {
  title: 'Додавання таблиці', // Automatically compiles to "Додавання таблиці | Корені"
  description: 'Додайте до Коренів власну таблицю індексації.',
  alternates: {
    canonical: '/contribute/',
  },
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
      <ContributeForm knownLocations={knownLocations} />
      <Comments />
    </>
  );
}
