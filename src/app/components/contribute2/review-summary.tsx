'use client';

import { Database, GitPullRequest, Info, MapPin, User } from 'lucide-react';

import styles from './review-summary.module.css';

/* ────────────────────────────────────────── */
/*  Mock summary data                          */
/* ────────────────────────────────────────── */

const DATASET_FIELDS: { key: string; value: React.ReactNode }[] = [
  { key: 'File', value: 'dataset_q1_2026.csv' },
  { key: 'Rows', value: '12,483' },
  { key: 'Columns', value: '24 (3 flagged for removal)' },
  { key: 'Skipped Rows', value: '1 (header offset)' },
  { key: 'Nulls Filled', value: '142' },
  { key: 'Duplicates', value: '3 removed' },
];

const CONTEXT_FIELDS: { key: string; value: React.ReactNode }[] = [
  { key: 'Location', value: 'Tymofiivka' },
  { key: 'Archive', value: 'DAOO' },
  { key: 'Year / Range', value: '1897 - 1921' },
  {
    key: 'Tags',
    value: (
      <span className={styles.tagList}>
        {['census', 'births', 'marriages', 'deaths'].map((t) => (
          <span key={t} className={styles.tag}>
            {t}
          </span>
        ))}
      </span>
    ),
  },
  { key: 'Generated ID', value: 'DAOO-TYM-1897' },
  {
    key: 'Generated Title',
    value: 'Tymofiivka \u2014 census, births, marriages, deaths',
  },
];

const AUTHOR_FIELDS: { key: string; value: React.ReactNode }[] = [
  { key: 'Name', value: 'Jane Doe' },
  { key: 'Email', value: 'jane@acme.com' },
  { key: 'GitHub', value: 'janedoe' },
];

/* ────────────────────────────────────────── */
/*  Summary card                               */
/* ────────────────────────────────────────── */

function SummaryCard({
  icon,
  title,
  fields,
}: {
  icon: React.ReactNode;
  title: string;
  fields: { key: string; value: React.ReactNode }[];
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardHeaderIcon}>{icon}</span>
        <span className={styles.cardHeaderTitle}>{title}</span>
      </div>
      <div className={styles.rows}>
        {fields.map((f) => (
          <div key={f.key} className={styles.row}>
            <span className={styles.rowKey}>{f.key}</span>
            <span className={styles.rowValue}>{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────── */
/*  Review summary                             */
/* ────────────────────────────────────────── */

export default function ReviewSummary() {
  return (
    <div className={styles.wrapper}>
      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className={styles.statusReady}>
          <span className={styles.statusDot} />
          Готове до подання
        </span>
      </div>

      {/* Cards grid — 2 cols on desktop, stacked on mobile */}
      <div className={styles.grid}>
        <SummaryCard
          icon={<Database size={13} />}
          title="Таблиця"
          fields={DATASET_FIELDS}
        />
        <SummaryCard
          icon={<MapPin size={13} />}
          title="Контекст"
          fields={CONTEXT_FIELDS}
        />
      </div>

      {/* Author — full width */}
      <SummaryCard
        icon={<User size={13} />}
        title="Автор"
        fields={AUTHOR_FIELDS}
      />

      {/* Notice */}
      <div className={styles.notice}>
        <span className={styles.noticeIcon}>
          <Info size={13} />
        </span>
        <span className={styles.noticeText}>
          З вашою таблицею та метаданими буде створена нова гілка Git і новий
          pull request на GitHub. Дані будуть перевірені командою Коренів перед
          доданням на сайт.
        </span>
      </div>

      {/* CTA */}
      <button type="button" className={styles.cta}>
        <span className={styles.ctaIcon}>
          <GitPullRequest size={15} strokeWidth={2.5} />
        </span>
        Подати
      </button>
    </div>
  );
}
