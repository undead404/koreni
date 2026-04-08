import UKRAINIAN_ARCHIVES from '@/shared/ukrainian-archives';

import styles from './archive-item.module.css';

export default function ArchiveItem({ archiveItem }: { archiveItem: string }) {
  if (
    !UKRAINIAN_ARCHIVES.some((archivePrefix) =>
      archiveItem.startsWith(archivePrefix),
    )
  ) {
    return (
      <li title="Ця справа походить з невідомого архіву">{archiveItem}</li>
    );
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
          rel="noreferrer"
        >
          🦆
        </a>
      </span>
    </li>
  );
}
