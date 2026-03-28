'use client';
import { ErrorMessage } from '@hookform/error-message';
import { X } from 'lucide-react';
import posthog from 'posthog-js';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import type { ContributeFormValues } from './types';

import styles from './source-input.module.css';

export interface SourceInputProperties {
  index: number;
  remove: (index: number) => void;
}

export default function SourceInput({ index, remove }: SourceInputProperties) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContributeFormValues>();
  const error = errors.sources?.[index]?.url;
  const errorId = `sources-error-${index}`;

  const onRemove = useCallback(() => {
    posthog.capture('source_removed', {
      source_index: index,
    });
    remove(index);
  }, [index, remove]);

  const renderError = useCallback(
    ({ message }: { message: string }) => (
      <p id={errorId} className={styles.error}>
        {message}
      </p>
    ),
    [errorId],
  );

  return (
    <div>
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
          onClick={onRemove}
          aria-label="Видалити посилання"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
      <ErrorMessage
        errors={errors}
        name={`sources.${index}.url` as keyof ContributeFormValues}
        render={renderError}
      />
    </div>
  );
}
