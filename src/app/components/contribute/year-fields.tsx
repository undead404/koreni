import type { UseFormRegister } from 'react-hook-form';

import styles from './contribute-form.module.css';

interface YearFieldsProperties {
  isSubmitting: boolean;
  isRange: boolean | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
}

export default function YearFields({
  isSubmitting,
  isRange,
  register,
}: YearFieldsProperties) {
  return (
    <fieldset className={styles.field}>
      <legend className={styles.label}>Роки</legend>
      <p id="period-desc" className={styles.description}>
        Ця таблиця стосується одного року чи діапазону років?
      </p>
      <div className={styles.radioGroup}>
        <label>
          <input
            disabled={isSubmitting}
            type="radio"
            value="false"
            {...register('periodType', { required: true })}
            aria-describedby="period-desc"
          />{' '}
          Один рік
        </label>
        <label>
          <input
            disabled={isSubmitting}
            type="radio"
            value="true"
            {...register('periodType', { required: true })}
            aria-describedby="period-desc"
          />{' '}
          Період
        </label>
      </div>

      {isRange ? (
        <div className={styles.yearsRow}>
          <input
            disabled={isSubmitting}
            type="number"
            {...register('yearStart', {
              required: isRange,
              min: 1600,
              max: 2030,
            })}
            className={styles.yearInput}
            placeholder="З (1897)"
            aria-label="Рік початку"
          />
          <input
            disabled={isSubmitting}
            type="number"
            {...register('yearEnd', {
              required: isRange,
              min: 1600,
              max: 2030,
            })}
            className={styles.yearInput}
            placeholder="По (1910)"
            aria-label="Рік кінця"
          />
        </div>
      ) : (
        <input
          disabled={isSubmitting}
          type="number"
          {...register('year', { required: !isRange, min: 1600, max: 2030 })}
          className={styles.yearInput}
          placeholder="1897"
          aria-label="Рік"
        />
      )}
    </fieldset>
  );
}
