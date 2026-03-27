import { ErrorMessage } from '@hookform/error-message';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import type { ContributeForm2Values } from './types';

import styles from './data-grid.module.css';

interface GridControlBarProperties {
  dataRowsLength: number;
  columnsCount: number;
  skippedRowsAbove: number;
  totalFlagged: number;
  setSkippedRowsAbove: (value: number) => void;
  register: UseFormRegister<ContributeForm2Values>;
  errors: FieldErrors<ContributeForm2Values>;
}

export function GridControlBar({
  dataRowsLength,
  columnsCount,
  skippedRowsAbove,
  totalFlagged,
  setSkippedRowsAbove,
  register,
  errors,
}: GridControlBarProperties) {
  return (
    <div className={styles.controlBar}>
      <div className={styles.controlGroup}>
        <label htmlFor="skip-rows" className={styles.controlLabel}>
          Заголовки зсунуті на:
        </label>
        <input
          id="skip-rows"
          type="number"
          min={0}
          max={dataRowsLength - 1}
          value={skippedRowsAbove}
          onChange={(event) => {
            const v = Math.max(
              0,
              Math.min(dataRowsLength - 1, Number(event.target.value) || 0),
            );
            setSkippedRowsAbove(v);
          }}
          className={styles.controlInput}
          step={1}
        />
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.controlLabel} htmlFor="table-locale">
          Мова таблиці:
        </label>
        <select
          id="table-locale"
          className={styles.controlSelect}
          defaultValue=""
          {...register('tableLocale')}
        >
          <option value="" disabled>
            Виберіть мову таблиці
          </option>
          <option value="pl">Польська</option>
          <option value="ru">російська</option>
          <option value="uk">Українська</option>
        </select>
        <ErrorMessage
          className={styles.error}
          errors={errors}
          name="tableLocale"
          as="span"
        />
      </div>

      <div className={styles.controlGroup}>
        <span className={styles.statBadge}>
          {dataRowsLength} рядів &times; {columnsCount} колонок
        </span>
        {totalFlagged > 0 && (
          <span className={styles.flaggedBadge}>
            {totalFlagged} до вилучення
          </span>
        )}
      </div>
    </div>
  );
}
