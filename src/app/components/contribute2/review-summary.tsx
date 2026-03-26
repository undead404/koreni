'use client';

import { Database, Info, MapPin, User } from 'lucide-react';
import posthog from 'posthog-js';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import z from 'zod';

import { initBugsnag } from '@/app/services/bugsnag';
import { reverseGeocode } from '@/app/services/locationiq';

import { useTableStateStore } from './table-state';
import { ContributeForm2Values } from './types';

import styles from './review-summary.module.css';

/* ────────────────────────────────────────── */
/*  Summary card                               */
/* ────────────────────────────────────────── */

function SummaryCard({
  icon,
  title,
  fields,
}: {
  icon: ReactNode;
  title: string;
  fields: { key: string; value: ReactNode }[];
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

const coordinatesStringAsTupleSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
  .transform((value) => {
    const [latString, longString] = value.split(',').map((s) => s.trim());
    const result = [
      Number.parseFloat(latString),
      Number.parseFloat(longString),
    ] as [number, number];
    if (Number.isNaN(result[0]) || Number.isNaN(result[1])) {
      throw new TypeError('Invalid coordinates');
    }
    return result;
  });
export default function ReviewSummary() {
  const [modernLocation, setModernLocation] = useState<string | null>('...');
  const { control } = useFormContext<ContributeForm2Values>();
  const allValues = useWatch({ control });
  useEffect(() => {
    try {
      const locationCoords = coordinatesStringAsTupleSchema.parse(
        allValues.location,
      );
      void reverseGeocode(locationCoords)
        .then((resultingLocation) =>
          setModernLocation(resultingLocation || allValues.location || '?'),
        )
        .catch((error) => {
          console.error(error);
          initBugsnag().notify(error as Error);
          posthog.capture('locationiq_reverse_geocode_error', {
            error: error instanceof Error ? error.message : String(error),
          });
          setModernLocation(allValues.location || '?');
        });
    } catch {
      setModernLocation(allValues.location || '?');
    }
  }, [allValues.location]);
  const {
    getTableDimensions,
    skippedColumns,
    skippedRowsAbove,
    skippedRowsElsewhere,
    tableFileName,
  } = useTableStateStore();
  const tableDimensions = getTableDimensions();
  const dataSummaryFields = useMemo(() => {
    return [
      { key: 'Файл', value: tableFileName },
      { key: 'Рядів', value: tableDimensions.rows.toLocaleString('uk') },
      { key: 'Колонок', value: tableDimensions.columns.toLocaleString('uk') },
      {
        key: 'Рядів пропущено',
        value: (skippedRowsAbove + skippedRowsElsewhere.size).toLocaleString(
          'uk',
        ),
      },
      {
        key: 'Колонок пропущено',
        value: skippedColumns.size.toLocaleString('uk'),
      },
      {
        key: 'Мова таблиці',
        value: allValues.tableLocale ?? null,
      },
    ];
  }, [
    allValues.tableLocale,
    skippedColumns.size,
    skippedRowsAbove,
    skippedRowsElsewhere.size,
    tableDimensions.columns,
    tableDimensions.rows,
    tableFileName,
  ]);
  const contextFields = useMemo(() => {
    return [
      { key: 'Ідентифікатор', value: allValues.id },
      { key: 'Назва', value: allValues.title },
      { key: 'Місце', value: modernLocation },
      {
        key: 'Архівні справи',
        value:
          allValues.archiveItems?.map((item) => item.item).join(', ') ?? null,
      },
      { key: 'Роки', value: allValues.yearsRange?.join(', ') ?? null },
    ];
  }, [
    allValues.archiveItems,
    allValues.id,
    allValues.title,
    allValues.yearsRange,
    modernLocation,
  ]);
  const authorFields = useMemo(() => {
    return [
      { key: 'Ім’я', value: allValues.authorName },
      { key: 'Електронна пошта', value: allValues.authorEmail ?? 'Не вказано' },
      { key: 'GitHub', value: allValues.authorGithubUsername ?? 'Не вказано' },
    ];
  }, [
    allValues.authorEmail,
    allValues.authorGithubUsername,
    allValues.authorName,
  ]);
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
          fields={dataSummaryFields}
        />
        <SummaryCard
          icon={<MapPin size={13} />}
          title="Контекст"
          fields={contextFields}
        />
      </div>

      {/* Author — full width */}
      <SummaryCard
        icon={<User size={13} />}
        title="Автор"
        fields={authorFields}
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
    </div>
  );
}
