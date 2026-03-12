import { useCallback, useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';

import type { ContributeForm2Values } from './types';

import styles from './years-input.module.css';

export default function YearsInput({
  onChange,
  value,
}: ControllerRenderProps<ContributeForm2Values, 'yearsRange'>) {
  const [inputValue, setInputValue] = useState(value?.join('-') || '');
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const yearRange = event.target.value;
      try {
        const [start, end] = yearRange
          .split('-')
          .map((year) => Number.parseInt(year.trim()));
        if (start) {
          if (end) {
            if (start <= end) {
              onChange([start, end]);
            } else {
              throw new Error('Invalid year range');
            }
          }
          onChange([start]);
        } else {
          throw new Error('Invalid year range');
        }
      } catch {
        onChange(null);
      }
      setInputValue(yearRange);
    },
    [onChange],
  );
  return (
    <>
      <label className={styles.label} htmlFor="year-input">
        Рік або діапазон років через дефіс
      </label>
      <input
        id="year-input"
        type="text"
        className={styles.input}
        placeholder="наприклад, 2020, або 2018-2024"
        pattern="^([0-9]{4})$|^([0-9]{4})-([0-9]{4})$"
        value={inputValue}
        onChange={handleChange}
      />
    </>
  );
}
