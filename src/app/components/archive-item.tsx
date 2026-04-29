import UKRAINIAN_ARCHIVES from '@/shared/ukrainian-archives';

import styles from './archive-item.module.css';

interface ArchiveItemProperties {
  archiveItem: string;
}

export default function ArchiveItem({ archiveItem }: ArchiveItemProperties) {
  const isKnownArchive = UKRAINIAN_ARCHIVES.some((archivePrefix) =>
    archiveItem.startsWith(archivePrefix),
  );

  if (!isKnownArchive) {
    return <li title="Ця справа походить з невідомого архіву">{archiveItem}</li>;
  }

  return (
    <li className={styles.root}>
      <span className={styles.wrapper}>
        {archiveItem}
        <a
          className={styles.link}
          href={`https://inspector.duckarchive.com/search?q=${archiveItem}`}
          target="_blank"
          title={`Шукати справу ${archiveItem} в Качиному інспекторі`}
          rel="noopener noreferrer"
        >
          <span role="img" aria-label="Качиний інспектор">
            🦆
          </span>
        </a>
      </span>
    </li>
  );
}
