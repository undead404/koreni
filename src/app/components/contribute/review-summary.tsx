import { Database, Info, MapPin, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useTableStateStore } from './table-state';
import type { ContributeFormValues } from './types';
import { useReverseGeocode } from './use-reverse-geocode';

import styles from './review-summary.module.css';

/* ────────────────────────────────────────── */
/*  Types & Constants                          */
/* ────────────────────────────────────────── */

interface SummaryField {
  key: string;
  value: string | string[] | number | null | undefined;
  type?: 'text' | 'tags' | 'location';
  displayValue?: string;
}

const ALPHABET_TITLES = {
  pl: 'Латинка',
  ru: 'російський',
  uk: 'Український',
} as const;

/* ────────────────────────────────────────── */
/*  Value Renderer                             */
/* ────────────────────────────────────────── */

function ValueRenderer({
  field,
  locationStatus,
}: {
  field: SummaryField;
  locationStatus?: 'idle' | 'loading' | 'error';
}) {
  const { displayValue, value, type } = field;

  if (displayValue) return <>{displayValue}</>;

  if (type === 'location' && locationStatus === 'loading') {
    return <span className={styles.pulse}>Пошук...</span>;
  }

  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return <span className={styles.emptyState}>Не вказано</span>;
  }

  if (type === 'tags') {
    const tags = Array.isArray(value) ? value : [value];
    return (
      <div className={styles.tagList}>
        {tags.map((tag, index) => (
          <span key={index} className={styles.tag}>
            {tag}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === 'number') {
    return <>{value.toLocaleString('uk-UA')}</>;
  }

  return <>{value}</>;
}

/* ────────────────────────────────────────── */
/*  Summary card                               */
/* ────────────────────────────────────────── */

function SummaryCard({
  icon,
  title,
  fields,
  onEdit,
  locationStatus,
}: {
  icon: ReactNode;
  title: string;
  fields: SummaryField[];
  onEdit?: () => void;
  locationStatus?: 'idle' | 'loading' | 'error';
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardHeaderIcon}>{icon}</span>
          <span className={styles.cardHeaderTitle}>{title}</span>
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} className={styles.editButton}>
            Редагувати
          </button>
        )}
      </div>
      <dl className={styles.rows}>
        {fields.map((f) => (
          <div key={f.key} className={styles.row}>
            <dt className={styles.rowKey}>{f.key}</dt>
            <dd className={styles.rowValue}>
              <ValueRenderer
                field={f}
                locationStatus={
                  f.type === 'location' ? locationStatus : undefined
                }
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ────────────────────────────────────────── */
/*  Review summary                             */
/* ────────────────────────────────────────── */

export default function ReviewSummary({
  onEditSection,
}: {
  onEditSection?: (section: string) => void;
}) {
  const { control } = useFormContext<ContributeFormValues>();

  // Consolidate RHF subscriptions into a single listener targeting only required fields.
  const [
    locationValue,
    tableLocale,
    idValue,
    titleValue,
    archiveItems,
    yearsRange,
    authorName,
    authorEmail,
    authorGithubUsername,
  ] = useWatch({
    control,
    name: [
      'location',
      'tableLocale',
      'id',
      'title',
      'archiveItems',
      'yearsRange',
      'authorName',
      'authorEmail',
      'authorGithubUsername',
    ],
  });

  const { location: modernLocation, status: locationStatus } =
    useReverseGeocode(locationValue);

  // Select primitive values and stable function references individually to prevent infinite re-renders
  const getTableDimensions = useTableStateStore((state) => state.getTableDimensions);
  const tableFileName = useTableStateStore((state) => state.tableFileName);
  const skippedRowsCount = useTableStateStore(
    (state) => state.skippedRowsAbove + state.skippedRowsElsewhere.size
  );
  const skippedColumnsCount = useTableStateStore((state) => state.skippedColumns.size);

  const tableDimensions = getTableDimensions();

  // React 19 Compiler automatically memoizes these structural arrays.
  const dataSummaryFields: SummaryField[] = [
    { key: 'Файл', value: tableFileName, type: 'text' },
    { key: 'Рядів', value: tableDimensions.rows, type: 'text' },
    { key: 'Колонок', value: tableDimensions.columns, type: 'text' },
    { key: 'Рядів пропущено', value: skippedRowsCount, type: 'text' },
    { key: 'Колонок пропущено', value: skippedColumnsCount, type: 'text' },
    {
      displayValue: tableLocale ? ALPHABET_TITLES[tableLocale] : undefined,
      key: 'Алфавіт таблиці',
      value: tableLocale,
      type: 'text',
    },
  ];

  const yearsDisplay =
    yearsRange.length === 2
      ? `${yearsRange[0]} — ${yearsRange[1]}`
      : yearsRange.join(', ');

  const contextFields: SummaryField[] = [
    { key: 'Ідентифікатор', value: idValue, type: 'text' },
    { key: 'Назва', value: titleValue, type: 'text' },
    { key: 'Місце', value: modernLocation, type: 'location' },
    {
      key: 'Архівні справи',
      value: archiveItems.map((item) => item.item),
      type: 'tags',
    },
    { key: 'Роки', value: yearsDisplay ? [yearsDisplay] : null, type: 'tags' },
  ];

  const authorFields: SummaryField[] = [
    { key: 'Ім’я', value: authorName, type: 'text' },
    { key: 'Електронна пошта', value: authorEmail, type: 'text' },
    { key: 'GitHub', value: authorGithubUsername, type: 'text' },
  ];

  return (
    <section aria-labelledby="summary-title" className={styles.wrapper}>
      <h2 id="summary-title" className="sr-only" style={{ display: 'none' }}>
        Підсумок
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className={styles.statusReady}>
          <span className={styles.statusDot} />
          Готове до подання
        </span>
      </div>

      <div className={styles.grid}>
        <SummaryCard
          icon={<Database size={13} />}
          title="Таблиця"
          fields={dataSummaryFields}
          onEdit={() => onEditSection?.('table')}
        />
        <SummaryCard
          icon={<MapPin size={13} />}
          title="Контекст"
          fields={contextFields}
          onEdit={() => onEditSection?.('context')}
          locationStatus={locationStatus}
        />
      </div>

      <SummaryCard
        icon={<User size={13} />}
        title="Автор"
        fields={authorFields}
        onEdit={() => onEditSection?.('author')}
      />

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
    </section>
  );
}
