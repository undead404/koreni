import { ErrorMessage } from '@hookform/error-message';
import { X } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import type { ContributeForm2Values } from './types';

import styles from './sources-input.module.css';

/**
 * Enables to add multiple sources links.
 * Starts with and empty field; then provides a button to add a new link.
 * @returns
 */
export default function SourcesInput() {
  const { control } = useFormContext<ContributeForm2Values>();
  return (
    <Controller
      control={control}
      name="sources"
      render={({ field, formState: { errors } }) => (
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="sources-input">
            Вихідні дані
          </label>
          <p className={styles.description}>
            Публічно доступні дані: ваша вихідна таблиця, а також скани архівної
            справи
          </p>
          {field.value.map((source, index) => (
            <div key={source.url} className={styles.arrayInputRow}>
              <input
                type="url"
                className={styles.input}
                placeholder="https://example.com/source"
                value={source.url}
                onChange={(event) => {
                  field.onChange([
                    ...field.value.slice(0, index),
                    { url: event.target.value },
                    ...field.value.slice(index + 1),
                  ]);
                }}
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => {
                  field.onChange([
                    ...field.value.slice(0, index),
                    ...field.value.slice(index + 1),
                  ]);
                }}
                aria-label={`Remove ${source.url}`}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
              <ErrorMessage
                className={styles.error}
                errors={errors}
                name={`sources.${index}.url` as keyof ContributeForm2Values}
                as="p"
              />
            </div>
          ))}
          <button
            type="button"
            className={styles.addButton}
            onClick={() => {
              field.onChange([...field.value, { url: '' }]);
            }}
          >
            Додати посилання
          </button>

          <ErrorMessage
            className={styles.error}
            errors={errors}
            name={`sources`}
            as="p"
          />
        </div>
      )}
    />
  );
}
