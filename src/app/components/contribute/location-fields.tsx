import type { UseFormRegister } from 'react-hook-form';

import styles from './contribute-form.module.css';
import ownStyles from './location-fields.module.css';
interface LocationFieldsProperties {
  isSubmitting: boolean;
  locationGuess: string;
  onShowLocationModal: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
}

export default function LocationFields({
  isSubmitting,
  locationGuess,
  onShowLocationModal,
  register,
}: LocationFieldsProperties) {
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
          disabled={isSubmitting}
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
