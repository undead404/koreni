'use client';

import {
  type ReactNode,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react';

import styles from './sources-filter.module.css';

type Properties = {
  archives: string[];
  hasOther: boolean;
  totalCount: number;
  children: ReactNode;
  emptyState?: ReactNode;
};

const OTHER = '__other__';

const startsWithLower = (value: string | undefined, query: string): boolean => {
  if (!query) return true;
  if (!value) return false;
  return value.toLowerCase().startsWith(query.toLowerCase());
};

export default function SourcesFilter({
  archives,
  hasOther,
  totalCount,
  children,
  emptyState,
}: Properties) {
  const containerReference = useRef<HTMLDivElement>(null);
  const [archive, setArchive] = useState('');
  const [fond, setFond] = useState('');
  const [opys, setOpys] = useState('');
  const [sprava, setSprava] = useState('');
  const [visibleCount, setVisibleCount] = useState(totalCount);

  const deferredArchive = useDeferredValue(archive);
  const deferredFond = useDeferredValue(fond);
  const deferredOpys = useDeferredValue(opys);
  const deferredSprava = useDeferredValue(sprava);

  useEffect(() => {
    const container = containerReference.current;
    if (!container) return;
    const rows = container.querySelectorAll<HTMLElement>('tr[data-archive]');
    const fondQuery = deferredFond.trim();
    const opysQuery = deferredOpys.trim();
    const spravaQuery = deferredSprava.trim();
    let visible = 0;
    for (const row of rows) {
      const rowArchive = row.dataset.archive ?? '';
      const archiveMatches =
        !deferredArchive ||
        (deferredArchive === OTHER
          ? rowArchive === ''
          : rowArchive === deferredArchive);
      const matches =
        archiveMatches &&
        startsWithLower(row.dataset.fond, fondQuery) &&
        startsWithLower(row.dataset.opys, opysQuery) &&
        startsWithLower(row.dataset.sprava, spravaQuery);
      const nextDisplay = matches ? '' : 'none';
      if (row.style.display !== nextDisplay) {
        row.style.display = nextDisplay;
      }
      if (matches) visible += 1;
    }
    setVisibleCount(visible);
  }, [deferredArchive, deferredFond, deferredOpys, deferredSprava]);

  const subfieldsDisabled = archive === OTHER;

  const reset = () => {
    setArchive('');
    setFond('');
    setOpys('');
    setSprava('');
  };

  return (
    <div ref={containerReference}>
      <div className={styles.filters}>
        <div className={styles.field}>
          <label htmlFor="filter-archive">Архів</label>
          <select
            id="filter-archive"
            value={archive}
            onChange={(event) => {
              setArchive(event.target.value);
              if (event.target.value === OTHER) {
                setFond('');
                setOpys('');
                setSprava('');
              }
            }}
          >
            <option value="">Усі</option>
            {archives.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
            {hasOther && <option value={OTHER}>Інші джерела</option>}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="filter-fond">Фонд</label>
          <input
            id="filter-fond"
            type="search"
            value={fond}
            onChange={(event) => {
              setFond(event.target.value);
            }}
            placeholder="напр. 384"
            disabled={subfieldsDisabled}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="filter-opys">Опис</label>
          <input
            id="filter-opys"
            type="search"
            value={opys}
            onChange={(event) => {
              setOpys(event.target.value);
            }}
            disabled={subfieldsDisabled}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="filter-sprava">Справа</label>
          <input
            id="filter-sprava"
            type="search"
            value={sprava}
            onChange={(event) => {
              setSprava(event.target.value);
            }}
            disabled={subfieldsDisabled}
          />
        </div>
        <div className={styles.field}>
          <button type="button" className={styles.reset} onClick={reset}>
            Скинути
          </button>
        </div>
      </div>
      <div className={styles.summary}>
        Показано {visibleCount.toLocaleString('uk-UA')} з{' '}
        {totalCount.toLocaleString('uk-UA')}
      </div>
      {visibleCount === 0 && emptyState}
      <div hidden={visibleCount === 0}>{children}</div>
    </div>
  );
}
