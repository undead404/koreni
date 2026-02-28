'use client';
import { ErrorMessage } from '@hookform/error-message';
import { useFormContext } from 'react-hook-form';

import type { ContributeFormValues } from './types';

import styles from './contribute-form.module.css';

export default function AdditionalInfoFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContributeFormValues>();
  return (
    <>
      <div className={styles.field}>
        <label htmlFor="archiveItems" className={styles.label}>
          Архівні шифри
        </label>
        <p id="archiveItems-desc" className={styles.description}>
          Перелік архівних справ, з яких взято дані. Кожен шифр з нового рядка.
        </p>
        <textarea
          id="archiveItems"
          {...register('archiveItems', {
            required: true,
            minLength: 5,
          })}
          aria-describedby="archiveItems-desc"
          className={styles.textarea}
          placeholder="ДАКО-384-10-242"
        />
        <ErrorMessage errors={errors} name="archiveItems" />
      </div>

      <div className={styles.field}>
        <label htmlFor="sources" className={styles.label}>
          Вихідні таблиці
        </label>
        <p id="sources-desc" className={styles.description}>
          Публічно доступні таблиці, наприклад, на Google Spreadsheets.
        </p>
        <textarea
          id="sources"
          {...register('sources', {
            minLength: 10,
          })}
          aria-describedby="sources-desc"
          className={styles.textarea}
          placeholder="https://example.com/source"
        />
        <ErrorMessage errors={errors} name="sources" />
      </div>
    </>
  );
}
