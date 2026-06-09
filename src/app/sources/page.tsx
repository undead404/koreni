import type { Metadata } from 'next';
import Link from 'next/link';

import getArchiveSources from '@/shared/get-archive-sources';

import SourcesFilter from './sources-filter';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Джерела',
  description: 'Перелік архівних справ на Коренях.',
  alternates: {
    canonical: '/sources/',
  },
  openGraph: {
    title: 'Джерела',
    description: 'Перелік архівних справ на Коренях.',
    url: '/sources/',
  },
  twitter: {
    title: 'Джерела',
    description: 'Перелік архівних справ на Коренях.',
  },
};

function formatYears(range: readonly number[]): string {
  if (range.length === 1) return String(range[0]);
  return `${range[0]}–${range[1]}`;
}

export default async function SourcesPage() {
  const sources = await getArchiveSources();
  const archives = [
    ...new Set(sources.map((s) => s.archive).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'uk'));
  const hasOther = sources.some((s) => !s.archive);

  return (
    <main className={styles.container}>
      <h1>Джерела</h1>
      <p className={styles.subtitle}>
        Архівні справи, з яких походять записи в таблицях Коренів. Перевірте, чи
        проіндексована потрібна вам справа.
      </p>

      <SourcesFilter
        archives={archives}
        hasOther={hasOther}
        totalCount={sources.length}
      >
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.compact}>Архів</th>
                <th className={styles.compact}>Фонд</th>
                <th className={styles.compact}>Опис</th>
                <th className={styles.compact}>Справа</th>
                <th className={styles.centered}>Роки</th>
                <th className={styles.centered}>Таблиці</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr
                  key={source.key}
                  data-archive={source.archive}
                  data-fond={source.fond}
                  data-opys={source.opys}
                  data-sprava={source.sprava}
                >
                  {source.archive ? (
                    <>
                      <td>{source.archive}</td>
                      <td>{source.fond}</td>
                      <td>{source.opys}</td>
                      <td>{source.sprava || '—'}</td>
                    </>
                  ) : (
                    <td colSpan={4} className={styles.raw}>
                      {source.raw}
                    </td>
                  )}
                  <td className={styles.years}>
                    {formatYears(source.yearsRange)}
                  </td>
                  <td className={styles.tablesCell}>
                    {source.tables.length >= 5 ? (
                      <details>
                        <summary>{source.tables.length} таблиць</summary>
                        {source.tables.map((t) => (
                          <Link key={t.id} href={`/${t.id}/1/`} title={t.title}>
                            {t.title}
                          </Link>
                        ))}
                      </details>
                    ) : (
                      source.tables.map((t) => (
                        <Link key={t.id} href={`/${t.id}/1/`} title={t.title}>
                          {t.title}
                        </Link>
                      ))
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SourcesFilter>
    </main>
  );
}
