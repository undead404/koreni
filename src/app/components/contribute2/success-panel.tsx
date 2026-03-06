'use client';

import { ExternalLink } from 'lucide-react';

import styles from './success-panel.module.css';

interface SuccessPanelProperties {
  name: string;
  title: string;
  prUrl: string;
}

export default function SuccessPanel({
  name,
  title,
  prUrl,
}: SuccessPanelProperties) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      {/* Animated checkmark */}
      <div className={styles.iconRing} aria-hidden="true">
        <svg
          className={styles.checkSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12l5 5L19 7" />
        </svg>
      </div>

      {/* Thank-you message */}
      <p className={styles.heading}>
        {'Thank you, '}
        {name}
        {'! Your submission '}
        <span className={styles.title}>{`\u201C${title}\u201D`}</span>
        {' has been submitted as a GitHub PR:'}
      </p>

      <p className={styles.sub}>
        {
          'A maintainer will review your pull request shortly. You\u2019ll receive a notification once it\u2019s merged.'
        }
      </p>

      {/* PR link chip */}
      <a
        href={prUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.prLink}
      >
        <span className={styles.prLinkIcon}>
          <ExternalLink size={14} />
        </span>
        {prUrl.replace('https://', '')}
      </a>
    </div>
  );
}
