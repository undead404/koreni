import {
  type ChangeEvent,
  type FC,
  type KeyboardEvent,
  type SubmitEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import styles from './search-controls.module.css';

export interface ControlsProperties {
  filters: { query: string; yearFrom: string; yearTo: string };
  onQueryChange: (query: string) => void;
  onYearCommit: (yearFrom: string, yearTo: string) => void;
}

const SearchControls: FC<ControlsProperties> = ({
  filters,
  onQueryChange,
  onYearCommit,
}) => {
  const [localYearFrom, setLocalYearFrom] = useState(filters.yearFrom);
  const [localYearTo, setLocalYearTo] = useState(filters.yearTo);

  useEffect(() => {
    setLocalYearFrom(filters.yearFrom);
    setLocalYearTo(filters.yearTo);
  }, [filters.yearFrom, filters.yearTo]);

  const handleQueryChange = useCallback(
    (changeEvent: ChangeEvent<HTMLInputElement>) => {
      onQueryChange(changeEvent.target.value);
    },
    [onQueryChange],
  );

  const handleYearFromChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setLocalYearFrom(value);

      // Auto-commit if exactly 4 digits or if cleared
      if (value.length === 4 || value === '') {
        onYearCommit(value, localYearTo);
      }
    },
    [localYearTo, onYearCommit],
  );

  const handleYearToChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setLocalYearTo(value);

      // Auto-commit if exactly 4 digits or if cleared
      if (value.length === 4 || value === '') {
        onYearCommit(localYearFrom, value);
      }
    },
    [localYearFrom, onYearCommit],
  );

  const handleYearCommit = useCallback(() => {
    onYearCommit(localYearFrom, localYearTo);
  }, [localYearFrom, localYearTo, onYearCommit]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleYearCommit();
      }
    },
    [handleYearCommit],
  );

  const handleSubmit = useCallback((event: SubmitEvent) => {
    event.preventDefault();
  }, []);

  return (
    <form className={styles.container} role="search" onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <input
          id="genealogical-indexes-search"
          type="search"
          value={filters.query}
          onChange={handleQueryChange}
          className={styles.input}
          placeholder="Мельник"
          aria-label="Шукати в генеалогічних індексах"
        />
      </div>
      <div className={styles.yearFilters}>
        <input
          type="number"
          value={localYearFrom}
          onChange={handleYearFromChange}
          onBlur={handleYearCommit}
          onKeyDown={handleKeyDown}
          placeholder="Рік від"
          aria-label="Рік від"
          name="year_from"
          className={styles.yearInput}
        />
        <span className={styles.separator}>-</span>
        <input
          type="number"
          value={localYearTo}
          onChange={handleYearToChange}
          onBlur={handleYearCommit}
          onKeyDown={handleKeyDown}
          placeholder="Рік до"
          aria-label="Рік до"
          name="year_to"
          className={styles.yearInput}
        />
      </div>
    </form>
  );
};

export default SearchControls;
