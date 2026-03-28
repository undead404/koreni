import { EXPAND_STEP } from './constants';

import styles from './data-grid.module.css';

interface GridPaginationProperties {
  hiddenCount: number;
  columnsLength: number;
  expandTop: () => void;
  expandBottom: () => void;
}

export function GridPagination({
  hiddenCount,
  columnsLength,
  expandTop,
  expandBottom,
}: GridPaginationProperties) {
  if (hiddenCount <= 0) return null;

  return (
    <>
      <tr className={styles.ellipsisRow}>
        <td colSpan={columnsLength + 1}>
          <button
            type="button"
            className={styles.ellipsisBtn}
            onClick={expandTop}
            aria-label={`Показати ще ${EXPAND_STEP} рядів зверху`}
            title={`Показати ще ${EXPAND_STEP} рядів`}
          >
            Показати ще {EXPAND_STEP} рядів
          </button>
        </td>
      </tr>
      <tr className={styles.ellipsisRow}>
        <td
          colSpan={columnsLength + 1}
          title={`Іще ${hiddenCount.toLocaleString()} рядів приховано`}
        >
          Іще {hiddenCount.toLocaleString()} рядів приховано
        </td>
      </tr>
      <tr className={styles.ellipsisRow}>
        <td colSpan={columnsLength + 1}>
          <button
            type="button"
            className={styles.ellipsisBtn}
            onClick={expandBottom}
            aria-label={`Показати ще ${EXPAND_STEP} рядів знизу`}
            title={`Показати ще ${EXPAND_STEP} рядів`}
          >
            Показати ще {EXPAND_STEP} рядів
          </button>
        </td>
      </tr>
    </>
  );
}
