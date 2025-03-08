'use client';
import { ReactNode, useCallback, useState } from 'react';

import withErrorBoundary from '../hocs/with-error-boundary';

import styles from './details.module.css';

export function Details(properties: {
  summary: string | ReactNode;
  children: ReactNode;
}) {
  const [show, setShow] = useState(false);
  const handleClick = useCallback(() => {
    setShow(true);
  }, []);

  return (
    <details className={styles.details} onClick={handleClick}>
      <summary>{properties.summary}</summary>
      {show && properties.children}
    </details>
  );
}

export default withErrorBoundary(Details);
