'use client';
import { ErrorMessage } from '@hookform/error-message';
import clsx from 'clsx';
import { useFieldArray, useFormContext } from 'react-hook-form';

import SourceInput from './source-input';
import type { ContributeFormValues } from './types';

import styles from './sources-input.module.css';

/**
 * Enables to add multiple sources links.
 * Starts with and empty field; then provides a button to add a new link.
 * @returns
 */
export default function SourcesInput() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ContributeFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sources',
  });

  return (
    <fieldset className={styles.fieldGroup}>
      <legend className={styles.label}>Вихідні дані</legend>
      <p className={styles.description}>
        Публічно доступні дані: ваша вихідна таблиця, а також скани архівної
        справи
      </p>

      {fields.map((field, index) => {
        return <SourceInput key={field.id} index={index} remove={remove} />;
      })}

      <button
        type="button"
        className={clsx(
          styles.addButton,
          fields.length === 0 && styles.addButtonPrimary,
        )}
        onClick={() => {
          append({ url: '' });
        }}
      >
        Додати посилання
      </button>

      <ErrorMessage
        errors={errors}
        name="sources"
        render={({ message }) => <p className={styles.error}>{message}</p>}
      />
    </fieldset>
  );
}
