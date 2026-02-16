import type { Metadata } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { object } from 'zod';

import Comments from '@/app/components/comments'; // Перевірте шлях імпорту
import ContactGate from '@/app/components/contact-gate';
import environment from '@/app/environment';
import getVolunteers from '@/app/helpers/get-volunteers';
import JsonLdTables from '@/app/tables/table-json-ld'; // Перевірте шлях
import { nonEmptyString } from '@/shared/schemas/non-empty-string';

import styles from './page.module.css';

// Константи рангів (дублюємо логіку для консистентності)
// В ідеалі це варто винести в окремий файл constants.ts
const RANKS = [
  { threshold: 10_000, title: 'Хранитель', className: styles.rankLegend },
  { threshold: 1000, title: 'Архіваріус', className: styles.rankArchivist },
  { threshold: 100, title: 'Реєстратор', className: styles.rankRegistrar },
  { threshold: 0, title: 'Писар', className: styles.rankScribe },
];

function getRank(power: number) {
  return RANKS.find((r) => power >= r.threshold) || RANKS.at(-1);
}

type VolunteerPageProperties = {
  params: Promise<unknown>;
};

const parametersSchema = object({
  volunteerSlug: nonEmptyString,
});
// 1. Генерація статичних шляхів (SSG)
export async function generateStaticParams() {
  const volunteers = await getVolunteers();
  return volunteers.map((volunteer) => ({
    volunteerSlug: volunteer.slug,
  }));
}

// 2. Генерація метаданих SEO
export async function generateMetadata({
  params,
}: VolunteerPageProperties): Promise<Metadata> {
  const { volunteerSlug } = parametersSchema.parse(await params);
  const volunteers = await getVolunteers();
  const volunteer = volunteers.find((v) => v.slug === volunteerSlug);

  if (!volunteer) return { title: 'Волонтер не знайдений' };

  return {
    title: `${volunteer.name} | Волонтер Корені`,
    description: `Волонтер ${volunteer.name} проіндексував ${volunteer.power} записів. Перегляньте опрацьовані архівні документи.`,
    alternates: {
      canonical: `${environment.NEXT_PUBLIC_SITE}/volunteers/${volunteer.slug}/`,
    },
  };
}

// 3. Основний компонент сторінки
export default async function VolunteerPage({
  params,
}: VolunteerPageProperties) {
  const { volunteerSlug } = parametersSchema.parse(await params);
  const volunteers = await getVolunteers();
  const volunteer = volunteers.find((v) => v.slug === volunteerSlug);

  if (!volunteer) {
    notFound();
  }

  const rank = getRank(volunteer.power);

  return (
    <>
      <Head>
        <link
          rel="canonical"
          href={`${environment.NEXT_PUBLIC_SITE}/volunteers/${volunteer.slug}/`}
          key="canonical"
        />
      </Head>

      <div className={styles.container}>
        {/* Верхній колонтитул профілю */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link href="/volunteers" className={styles.backLink}>
              ← Всі волонтери
            </Link>
            <span className={`${styles.rankBadge} ${rank!.className}`}>
              {rank!.title}
            </span>
          </div>

          <h1 className={styles.name}>{volunteer.name}</h1>
          <p className={styles.contact}>
            Електронна пошта:{' '}
            <ContactGate contact={volunteer.emails.join(', ')} />
          </p>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {volunteer.power.toLocaleString('uk-UA')}
              </span>
              <span className={styles.statLabel}>записів</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {volunteer.tables.length}
              </span>
              <span className={styles.statLabel}>таблиць</span>
            </div>
          </div>
        </header>

        <hr className={styles.divider} />

        {/* Список таблиць */}
        <section>
          <h2 className={styles.sectionTitle}>Додані таблиці</h2>
          <ul className={`no-disc ${styles.list}`}>
            {volunteer.tables.map((tableMetadata) => (
              <li key={tableMetadata.id} className={styles.listItem}>
                <a
                  href={`/${tableMetadata.id}/1/`}
                  className={styles.tableLink}
                >
                  {tableMetadata.title}
                </a>
                <span className={styles.tableMeta}>
                  {tableMetadata.size} записів
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.commentsWrapper}>
          <Comments />
        </div>

        {/* JSON-LD для Google, щоб він бачив зв'язок автора і таблиць */}
        <JsonLdTables tablesMetadata={volunteer.tables} />
      </div>
    </>
  );
}
