import { ErrorMessage } from '@hookform/error-message';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import type { ContributeForm2Values } from './types';

import styles from './sources-input.module.css';

/**
 * Enables to add multiple sources links.
 * Starts with and empty field; then provides a button to add a new link.
 * @returns
 */
export default function SourcesInput() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ContributeForm2Values>();

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
        const error = errors.sources?.[index]?.url;
        const errorId = `sources-error-${index}`;

        return (
          <div key={field.id}>
            <div className={styles.arrayInputRow}>
              <input
                id={`sources-input-${index}`}
                type="url"
                className={styles.input}
                placeholder="https://example.com/source"
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                {...register(`sources.${index}.url` as const)}
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => remove(index)}
                aria-label="Видалити посилання"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
            <ErrorMessage
              errors={errors}
              name={`sources.${index}.url` as keyof ContributeForm2Values}
              render={({ message }) => (
                <p id={errorId} className={styles.error}>
                  {message}
                </p>
              )}
            />
          </div>
        );
      })}

      <button
        type="button"
        className={clsx(
          styles.addButton,
          fields.length === 0 && styles.addButtonPrimary,
        )}
        onClick={() => append({ url: '' })}
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
