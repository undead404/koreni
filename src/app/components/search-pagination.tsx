import { useCallback } from 'react';

import styles from './search-pagination.module.css';

export interface SearchPaginationProperties {
  onPageChange: (newPage: number) => void;
  currentPage: number;
  totalPages: number;
}

export default function SearchPagination({
  onPageChange,
  currentPage,
  totalPages,
}: SearchPaginationProperties) {
  const goToPreviousPage = useCallback(() => {
    onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const goToNextPage = useCallback(() => {
    onPageChange(currentPage + 1);
  }, [currentPage, onPageChange]);

  return (
    <nav className={styles.nav} aria-label="Pagination">
      <button
        onClick={goToPreviousPage}
        disabled={currentPage <= 1}
        className={styles.button}
      >
        Попередня
      </button>

      <span className={styles.text}>
        Сторінка {currentPage} з {totalPages || 1}
      </span>

      <button
        onClick={goToNextPage}
        disabled={currentPage >= totalPages}
        className={styles.button}
      >
        Наступна
      </button>
    </nav>
  );
}
