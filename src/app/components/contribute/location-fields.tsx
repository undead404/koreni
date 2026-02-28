'use client';
import { ErrorMessage } from '@hookform/error-message';
import { useFormContext } from 'react-hook-form';

import type { ContributeFormValues } from './types';

import styles from './contribute-form.module.css';
import ownStyles from './location-fields.module.css';
interface LocationFieldsProperties {
  locationGuess: string;
  onShowLocationModal: () => void;
}

export default function LocationFields({
  locationGuess,
  onShowLocationModal,
}: LocationFieldsProperties) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContributeFormValues>();
  return (
    <div className={styles.field}>
      <label htmlFor="location" className={styles.label}>
        Координати (Широта, Довгота)
      </label>
      <p className={styles.description}>
        Введіть два числа через кому. Можна знайти на Google Maps. Наприклад:{' '}
        <code>50.45, 30.52</code>.
      </p>
      <div className={ownStyles.inputWrapper}>
        <button
          type="button"
          className={styles.resetButton}
          onClick={onShowLocationModal}
        >
          Запозичити в іншої таблиці
        </button>
        <input
          autoComplete="on"
          id="location"
          type="text"
          {...register('location', {
            required: true,
            pattern: {
              value: /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/,
              message:
                'Формат: широта, довгота (два десяткові числа через кому)',
            },
          })}
          className={`${styles.input} ${ownStyles.input}`}
          placeholder="50.45, 30.52"
        />
        <ErrorMessage errors={errors} name="location" />
      </div>
      {locationGuess && (
        <p className={styles.locationGuess}>
          <span className={ownStyles.hint}>Найближче сучасне поселення</span>:{' '}
          {locationGuess}
        </p>
      )}
    </div>
  );
}
