'use client';

import posthog from 'posthog-js';
import { type ReactNode, useCallback } from 'react';

import styles from './details.module.css';

export function Details(properties: {
  open?: boolean;
  summary: string | ReactNode;
  sectionName?: string;
  children: ReactNode;
}) {
  const handleToggle = useCallback(
    (event: React.SyntheticEvent<HTMLDetailsElement>) => {
      const isOpen = event.currentTarget.open;
      posthog.capture('details_toggled', {
        section_name: properties.sectionName || 'unknown',
        is_expanded: isOpen,
      });
    },
    [],
  );

  return (
    <details
      className={styles.details}
      open={properties.open}
      onToggle={handleToggle}
    >
      <summary>{properties.summary}</summary>
      {properties.children}
    </details>
  );
}

export default Details;
