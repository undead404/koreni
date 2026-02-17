'use client';

import posthog from 'posthog-js';
import { type ReactNode, useCallback } from 'react';

import styles from './details.module.css';

function Details({
  open,
  summary,
  sectionName,
  children,
}: {
  open?: boolean;
  summary: string | ReactNode;
  sectionName?: string;
  children: ReactNode;
}) {
  const handleToggle = useCallback(
    (event: React.SyntheticEvent<HTMLDetailsElement>) => {
      const isOpen = event.currentTarget.open;
      posthog.capture('details_toggled', {
        section_name: sectionName || 'unknown',
        is_expanded: isOpen,
      });
    },
    [sectionName],
  );

  return (
    <details className={styles.details} open={open} onToggle={handleToggle}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}

export default Details;
