'use client';
import { ErrorMessage } from '@hookform/error-message';
import posthog from 'posthog-js';
import { useFieldArray, useFormContext } from 'react-hook-form';

import type { ContributeFormValues } from './types';

import styles from './additional-info-fields.module.css';

export default function AdditionalInfoFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ContributeFormValues>();
  const {
    fields: archiveItemsFields,
    append: appendArchiveItem,
    remove: removeArchiveItem,
  } = useFieldArray({
    control,
    name: 'archiveItems',
    rules: {
      minLength: {
        value: 1,
        message: 'Додайте принаймні один архівний шифр',
      },
    },
  });
  const {
    fields: sourcesFields,
    append: appendSource,
    remove: removeSource,
  } = useFieldArray({
    control,
    name: 'sources',
  });
  return (
    <>
      <div className={styles.field}>
        <span id="archiveItems-label" className={styles.label}>
          Архівні шифри
        </span>
        <p id="archiveItems-desc" className={styles.description}>
          Перелік архівних справ, з яких взято дані.
        </p>
        {archiveItemsFields.map((field, index) => (
          <div key={field.id} className={styles.arrayInputRow}>
            <input
              {...register(`archiveItems.${index}.item`, {
                required: 'Архівний шифр є обовʼязковим',
                minLength: {
                  value: 5,
                  message: 'Архівний шифр має бути довшим',
                },
              })}
              aria-labelledby="archiveItems-label"
              aria-describedby="archiveItems-desc"
              className={styles.input}
              placeholder="ДАКО-384-10-242"
            />
            {archiveItemsFields.length > 1 ? (
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => {
                  posthog.capture('contribution_remove_archive_item');
                  removeArchiveItem(index);
                }}
              >
                Видалити
              </button>
            ) : null}
            <ErrorMessage
              errors={errors}
              name={`archiveItems.${index}.item`}
              as="p"
            />
          </div>
        ))}
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            posthog.capture('contribution_add_archive_item');
            appendArchiveItem({ item: '' });
          }}
        >
          Додати ще один шифр
        </button>
        <ErrorMessage errors={errors} name="archiveItems" as="p" />
      </div>

      <div className={styles.field}>
        <span id="sources-label" className={styles.label}>
          Вихідні таблиці
        </span>
        <p id="sources-desc" className={styles.description}>
          Публічно доступні таблиці, наприклад, на Google Spreadsheets.
        </p>
        {sourcesFields.map((field, index) => (
          <div key={field.id} className={styles.arrayInputRow}>
            <input
              {...register(`sources.${index}.url`)}
              type="url"
              aria-labelledby="sources-label"
              aria-describedby="sources-desc"
              className={styles.input}
              placeholder="https://example.com/source"
            />
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => {
                posthog.capture('contribution_remove_source');
                removeSource(index);
              }}
            >
              Видалити
            </button>
            <ErrorMessage
              errors={errors}
              name={`sources.${index}.url`}
              as="p"
            />
          </div>
        ))}
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            posthog.capture('contribution_add_source');
            appendSource({ url: '' });
          }}
        >
          Додати вихідну таблицю
        </button>
        <ErrorMessage errors={errors} name="sources" as="p" />
      </div>
    </>
  );
}
