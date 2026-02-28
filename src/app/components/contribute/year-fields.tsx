'use client';
import { ErrorMessage } from '@hookform/error-message';
import { useFormContext, useWatch } from 'react-hook-form';

import { ContributeFormValues } from './types';

import styles from './contribute-form.module.css';

export default function YearFields() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ContributeFormValues>();
  const periodTypeValue = useWatch({ control, name: 'periodType' });
  return (
    <fieldset className={styles.field}>
      <legend className={styles.label}>Роки</legend>
      <p id="period-desc" className={styles.description}>
        Ця таблиця стосується одного року чи діапазону років?
      </p>
      <div className={styles.radioGroup}>
        <label>
          <input
            type="radio"
            value="single"
            {...register('periodType', { required: true })}
            aria-describedby="period-desc"
          />{' '}
          Один рік
        </label>
        <label>
          <input
            type="radio"
            value="multiple"
            {...register('periodType', { required: true })}
            aria-describedby="period-desc"
          />{' '}
          Період
        </label>
        <ErrorMessage errors={errors} name="periodType" />
      </div>

      {periodTypeValue === 'multiple' && (
        <div className={styles.yearsRow}>
          <input
            autoComplete="on"
            type="number"
            {...register('yearStart', {
              required: periodTypeValue === 'multiple',
              min: 1600,
              max: 2030,
              valueAsNumber: true,
            })}
            className={styles.yearInput}
            placeholder="З (1897)"
            aria-label="Рік початку"
          />
          <input
            autoComplete="on"
            type="number"
            {...register('yearEnd', {
              required: periodTypeValue === 'multiple',
              min: 1600,
              max: 2030,
              valueAsNumber: true,
            })}
            className={styles.yearInput}
            placeholder="По (1910)"
            aria-label="Рік кінця"
          />
          <ErrorMessage errors={errors} name="yearStart" />
          <ErrorMessage errors={errors} name="yearEnd" />
        </div>
      )}
      {periodTypeValue === 'single' && (
        <>
          <input
            autoComplete="on"
            type="number"
            {...register('year', {
              required: periodTypeValue === 'single',
              min: 1600,
              max: 2030,
              valueAsNumber: true,
            })}
            className={styles.yearInput}
            placeholder="1897"
            aria-label="Рік"
          />
          <ErrorMessage errors={errors} name="year" />
        </>
      )}
    </fieldset>
  );
}
