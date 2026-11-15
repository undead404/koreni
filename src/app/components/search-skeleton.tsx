import styles from './search.module.css';
import controlsStyles from './search-controls.module.css';
import resultsStyles from './search-results.module.css';

interface SearchSkeletonProperties {
  recordsNumber: number;
}

export default function SearchSkeleton({
  recordsNumber,
}: SearchSkeletonProperties) {
  return (
    <section
      className={styles.section}
      aria-label="Завантаження пошуку"
      aria-busy="true"
    >
      <div className={controlsStyles.container} aria-hidden="true" inert>
        <div className={controlsStyles.inputGroup}>
          <input
            className={controlsStyles.input}
            type="search"
            placeholder="Мельник"
            disabled
          />
        </div>
        <div className={controlsStyles.yearFilters}>
          <input
            className={controlsStyles.yearInput}
            type="number"
            placeholder="Рік від"
            disabled
          />
          <span className={controlsStyles.separator}>-</span>
          <input
            className={controlsStyles.yearInput}
            type="number"
            placeholder="Рік до"
            disabled
          />
        </div>
      </div>
      <div className={resultsStyles.container}>
        <header className={resultsStyles.header}>
          <span>Всього рядків у таблицях: {recordsNumber}</span>
        </header>
      </div>
    </section>
  );
}
