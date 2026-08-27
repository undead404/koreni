'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import UKRAINIAN_ARCHIVES from '@/app/constants/ukrainian-archives';

import styles from './archive-item.module.css';

interface ArchiveItemProperties {
  archiveItem: string;
}

export default function ArchiveItem({ archiveItem }: ArchiveItemProperties) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  );

  const isKnownArchive = UKRAINIAN_ARCHIVES.some((archivePrefix) =>
    archiveItem.startsWith(archivePrefix),
  );

  const handleCopy = async () => {
    try {
      if (!('clipboard' in navigator)) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(archiveItem);
      setCopyStatus('copied');
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => {
        setCopyStatus('idle');
      }, 3000);
    }
  };

  const searchUrl = `https://inspector.duckarchive.com/search?q=${encodeURIComponent(archiveItem)}`;
  const searchTitle = `Шукати справу ${archiveItem} в Качиному інспекторі`;
  const copyTitle = `Скопіювати код справи ${archiveItem}`;

  return (
    <li
      className={styles.root}
      title={
        isKnownArchive ? undefined : 'Ця справа походить з невідомого архіву'
      }
    >
      <div className={styles.wrapper}>
        <span className={styles.code}>{archiveItem}</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.copyButton}
            onClick={() => {
              void handleCopy();
            }}
            title={copyTitle}
            aria-label={`Скопіювати код справи ${archiveItem}`}
          >
            {copyStatus === 'copied' ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
          </button>
          {isKnownArchive && (
            <a
              className={styles.searchLink}
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={searchTitle}
              aria-label={`Шукати справу ${archiveItem} в Качиному інспекторі`}
            >
              <span aria-hidden="true">🦆</span>
            </a>
          )}
        </div>
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {copyStatus === 'copied' && `Код справи ${archiveItem} скопійовано`}
        {copyStatus === 'error' &&
          `Не вдалося скопіювати код справи ${archiveItem}`}
      </span>
    </li>
  );
}
