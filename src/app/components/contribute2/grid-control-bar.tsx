import styles from './data-grid.module.css';

interface GridControlBarProperties {
  dataRowsLength: number;
  columnsCount: number;
  skippedRowsAbove: number;
  totalFlagged: number;
  setSkippedRowsAbove: (value: number) => void;
}

export function GridControlBar({
  dataRowsLength,
  columnsCount,
  skippedRowsAbove,
  totalFlagged,
  setSkippedRowsAbove,
}: GridControlBarProperties) {
  return (
    <div className={styles.controlBar}>
      <div className={styles.controlGroup}>
        <label htmlFor="skip-rows" className={styles.controlLabel}>
          Заголовки зсунуті на:
        </label>
        <input
          id="skip-rows"
          type="number"
          min={0}
          max={dataRowsLength - 1}
          value={skippedRowsAbove}
          onChange={(event) => {
            const v = Math.max(
              0,
              Math.min(dataRowsLength - 1, Number(event.target.value) || 0),
            );
            setSkippedRowsAbove(v);
          }}
          className={styles.controlInput}
          step={1}
        />
      </div>
      <div className={styles.controlGroup}>
        <span className={styles.statBadge}>
          {dataRowsLength} рядів &times; {columnsCount} колонок
        </span>
        {totalFlagged > 0 && (
          <span className={styles.flaggedBadge}>
            {totalFlagged} до вилучення
          </span>
        )}
      </div>
    </div>
  );
}
