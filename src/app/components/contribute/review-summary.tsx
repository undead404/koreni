'use client';

import { Database, Info, MapPin, User } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { initBugsnag } from '@/app/services/bugsnag';
import { reverseGeocode } from '@/app/services/locationiq';

import { coordinatesStringAsTupleSchema } from './schema';
import { useTableStateStore } from './table-state';
import type { ContributeFormValues } from './types';

import styles from './review-summary.module.css';

/* ────────────────────────────────────────── */
/*  Types                                      */
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

  if (displayValue) {
    return <>{displayValue}</>;
  }

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
  const [modernLocation, setModernLocation] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'error'
  >('idle');

  const { control } = useFormContext<ContributeFormValues>();

  // Specific observers to prevent full re-renders
  const locationValue = useWatch({ control, name: 'location' });
  const tableLocale = useWatch({ control, name: 'tableLocale' });
  const idValue = useWatch({ control, name: 'id' });
  const titleValue = useWatch({ control, name: 'title' });
  const archiveItems = useWatch({ control, name: 'archiveItems' });
  const yearsRange = useWatch({ control, name: 'yearsRange' });
  const authorName = useWatch({ control, name: 'authorName' });
  const authorEmail = useWatch({ control, name: 'authorEmail' });
  const authorGithubUsername = useWatch({
    control,
    name: 'authorGithubUsername',
  });
  const posthog = usePostHog();

  // Debounced Geocoding
  useEffect(() => {
    if (!locationValue) {
      setModernLocation(null);
      setLocationStatus('idle');
      return;
    }

    setLocationStatus('loading');
    const timeoutId = setTimeout(() => {
      try {
        const locationCoords =
          coordinatesStringAsTupleSchema.parse(locationValue);
        reverseGeocode(locationCoords)
          .then((resultingLocation) => {
            // eslint-disable-next-line promise/always-return
            setModernLocation(resultingLocation || locationValue);
            setLocationStatus('idle');
          })
          .catch((error: unknown) => {
            console.error(error);
            initBugsnag().notify(error as Error);
            posthog.capture('locationiq_reverse_geocode_error', {
              error: error instanceof Error ? error.message : String(error),
            });
            setModernLocation(locationValue);
            setLocationStatus('error');
          });
      } catch {
        setModernLocation(locationValue);
        setLocationStatus('error');
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [locationValue, posthog]);

  const {
    getTableDimensions,
    skippedColumns,
    skippedRowsAbove,
    skippedRowsElsewhere,
    tableFileName,
  } = useTableStateStore();

  const tableDimensions = getTableDimensions();

  const dataSummaryFields: SummaryField[] = useMemo(() => {
    return [
      { key: 'Файл', value: tableFileName, type: 'text' },
      { key: 'Рядів', value: tableDimensions.rows, type: 'text' },
      { key: 'Колонок', value: tableDimensions.columns, type: 'text' },
      {
        key: 'Рядів пропущено',
        value: skippedRowsAbove + skippedRowsElsewhere.size,
        type: 'text',
      },
      {
        key: 'Колонок пропущено',
        value: skippedColumns.size,
        type: 'text',
      },
      {
        displayValue: tableLocale ? ALPHABET_TITLES[tableLocale] : undefined,
        key: 'Алфавіт таблиці',
        value: tableLocale,
        type: 'text',
      },
    ];
  }, [
    tableLocale,
    skippedColumns.size,
    skippedRowsAbove,
    skippedRowsElsewhere.size,
    tableDimensions.columns,
    tableDimensions.rows,
    tableFileName,
  ]);

  const contextFields: SummaryField[] = useMemo(() => {
    let yearsDisplay = null;
    if (yearsRange.length > 0) {
      yearsDisplay =
        yearsRange.length === 2
          ? `${yearsRange[0]} — ${yearsRange[1]}`
          : yearsRange.join(', ');
    }

    return [
      { key: 'Ідентифікатор', value: idValue, type: 'text' },
      { key: 'Назва', value: titleValue, type: 'text' },
      { key: 'Місце', value: modernLocation, type: 'location' },
      {
        key: 'Архівні справи',
        value: archiveItems.map((item) => item.item),
        type: 'tags',
      },
      {
        key: 'Роки',
        value: yearsDisplay ? [yearsDisplay] : null,
        type: 'tags',
      },
    ];
  }, [archiveItems, idValue, titleValue, yearsRange, modernLocation]);

  const authorFields: SummaryField[] = useMemo(() => {
    return [
      { key: 'Ім’я', value: authorName, type: 'text' },
      { key: 'Електронна пошта', value: authorEmail, type: 'text' },
      { key: 'GitHub', value: authorGithubUsername, type: 'text' },
    ];
  }, [authorEmail, authorGithubUsername, authorName]);

  return (
    <section aria-labelledby="summary-title" className={styles.wrapper}>
      <h2 id="summary-title" className="sr-only" style={{ display: 'none' }}>
        Підсумок
      </h2>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className={styles.statusReady}>
          <span className={styles.statusDot} />
          Готове до подання
        </span>
      </div>

      {/* Cards grid */}
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

      {/* Author — full width */}
      <SummaryCard
        icon={<User size={13} />}
        title="Автор"
        fields={authorFields}
        onEdit={() => onEditSection?.('author')}
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
    </section>
  );
}
