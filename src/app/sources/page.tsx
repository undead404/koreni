import type { Metadata } from 'next';
import Link from 'next/link';

import getArchiveSources from '@/shared/get-archive-sources';

import SourcesFilter from './sources-filter';

import styles from './page.module.css';

const TITLE = 'Джерела';
const DESCRIPTION =
  'Перелік архівних справ, проіндексованих на Коренях повністю або частково';
const TABLES_PLURAL_RULES = new Intl.PluralRules('uk-UA');

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/sources/',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/sources/',
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
  },
};

function formatYears(range: readonly number[]): string {
  if (range.length === 1) return String(range[0]);
  return `${range[0]}–${range[1]}`;
}

function formatTablesCount(count: number): string {
  const label = (() => {
    switch (TABLES_PLURAL_RULES.select(count)) {
      case 'one': {
        return 'таблиця';
      }
      case 'few': {
        return 'таблиці';
      }
      default: {
        return 'таблиць';
      }
    }
  })();

  return `${count} ${label}`;
}

export default async function SourcesPage() {
  const sources = await getArchiveSources();
  const archives = [
    ...new Set(sources.map((s) => s.archive).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'uk'));
  const hasOther = sources.some((s) => !s.archive);

  return (
    <section className={styles.container} aria-labelledby="sources-title">
      <header className={styles.header}>
        <h1 id="sources-title" className={styles.title}>
          {TITLE}
        </h1>
        <p className={styles.subtitle}>{DESCRIPTION}</p>
      </header>

      <SourcesFilter
        archives={archives}
        hasOther={hasOther}
        totalCount={sources.length}
        emptyState={
          <p className={styles.empty}>
            Нічого не знайдено для поточних фільтрів. Спробуйте змінити умови
            пошуку.
          </p>
        }
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
                        <summary>
                          {formatTablesCount(source.tables.length)}
                        </summary>
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
    </section>
  );
}
