import { Metadata } from 'next';
import Link from 'next/link';

import getVolunteers from '@/app/helpers/get-volunteers';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Корені | Волонтери',
  description:
    'Спільнота дослідників, які індексують архівні документи та відкривають їх скарби для всіх.',
};

// Конфігурація рангів прив'язана до класів CSS
const RANKS = [
  {
    threshold: 10_000,
    title: 'Хранитель',
    className: styles.rankLegend,
  },
  { threshold: 1000, title: 'Архіваріус', className: styles.rankArchivist },
  { threshold: 100, title: 'Упорядник', className: styles.rankResearcher },
  { threshold: 0, title: 'Писар', className: styles.rankNovice },
];

function getRank(power: number) {
  return RANKS.find((r) => power >= r.threshold) || RANKS.at(-1);
}

export default async function VolunteersPage() {
  const volunteers = await getVolunteers();

  // Сортуємо: лідери зверху
  const sortedVolunteers = [...volunteers].sort((a, b) => b.power - a.power);

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Наші волонтери</h1>
        <p className={styles.subtitle}>
          Цей проект існує завдяки людям, які витрачають свій час на розшифровку
          архівних документів. Кожен запис наближає когось до віднайдення свого
          коріння.
        </p>
      </div>

      <div className={styles.grid}>
        {sortedVolunteers.map((volunteer) => {
          const rank = getRank(volunteer.power);

          return (
            <Link
              key={volunteer.slug}
              href={`/volunteers/${volunteer.slug}`}
              className={styles.cardLink}
            >
              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  {volunteer.name === 'Невідомі' ? (
                    <div />
                  ) : (
                    <div className={`${styles.rankBadge} ${rank!.className}`}>
                      {rank!.title}
                    </div>
                  )}
                  <span className={styles.arrow}>→</span>
                </div>

                <h2 className={styles.name}>{volunteer.name}</h2>

                <div className={styles.statsRow}>
                  <span className={styles.powerValue}>
                    {volunteer.power.toLocaleString('uk-UA')}
                  </span>
                  <span className={styles.powerLabel}>записів</span>
                </div>

                <div className={styles.footer}>
                  Додано таблиць: {volunteer.tables.length}
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {sortedVolunteers.length === 0 && (
        <div className={styles.emptyState}>
          <p>Поки що немає активних волонтерів. Станьте першим!</p>
        </div>
      )}
    </main>
  );
}
