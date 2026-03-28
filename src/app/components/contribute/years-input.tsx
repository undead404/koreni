import clsx from 'clsx';
import { type ChangeEvent, useCallback, useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';

import type { ContributeFormValues } from './types';

import styles from './years-input.module.css';

function parseYearRange(input: string): [number] | [number, number] | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // Matches exactly 4 digits, optionally followed by a hyphen and another 4 digits, allowing spaces
  const match = trimmed.match(/^(\d{4})(?:\s*-\s*(\d{4}))?$/);
  if (!match) {
    return null;
  }

  const start = Number.parseInt(match[1], 10);

  if (match[2]) {
    const end = Number.parseInt(match[2], 10);
    if (start <= end) {
      return [start, end];
    }
    return null; // Invalid logic: start > end
  }

  return [start];
}

export default function YearsInput({
  onChange,
  value,
}: ControllerRenderProps<ContributeFormValues, 'yearsRange'>) {
  const [inputValue, setInputValue] = useState(value?.join(' - ') || '');
  const [isInvalid, setIsInvalid] = useState(false);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      // Basic input masking: allow only digits, hyphens, and spaces
      const rawValue = event.target.value.replaceAll(/[^\d\s-]/g, '');
      setInputValue(rawValue);

      if (!rawValue.trim()) {
        onChange(null);
        setIsInvalid(false);
        return;
      }

      const parsed = parseYearRange(rawValue);
      if (parsed) {
        onChange(parsed);
        setIsInvalid(false);
      } else {
        // We don't call onChange with invalid data, keeping the parent state clean
        // We also don't immediately set isInvalid to true while typing to avoid flashing errors
      }
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    if (!inputValue.trim()) {
      setIsInvalid(false);
      return;
    }
    const parsed = parseYearRange(inputValue);
    setIsInvalid(parsed === null);
  }, [inputValue]);

  return (
    <>
      <label className={styles.label} htmlFor="year-input">
        Рік або діапазон років через дефіс
      </label>
      <input
        id="year-input"
        type="text"
        className={clsx(styles.input, isInvalid && styles.inputInvalid)}
        placeholder="наприклад, 1944, або 1873-1882"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? 'year-input-error' : undefined}
      />
      {isInvalid && (
        <span id="year-input-error" className={styles.errorMessage}>
          Неправильний формат. Введіть 4 цифри (наприклад, 1944) або діапазон
          (наприклад, 1873-1882).
        </span>
      )}
    </>
  );
}
