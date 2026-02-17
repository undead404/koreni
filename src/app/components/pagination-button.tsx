'use client';

import Link from 'next/link';
import posthog from 'posthog-js';
import { useCallback } from 'react';

import styles from './pagination-button.module.css';

export default function PaginationButton({
  page,
  href,
  isCurrent,
}: {
  page: number;
  href: string;
  isCurrent?: boolean;
}) {
  const handleClick = useCallback(() => {
    posthog.capture('pagination_clicked', {
      target_page: page,
      destination_url: href,
    });
  }, [href, page]);

  return isCurrent ? (
    <span className={styles.currentPage}>{page}</span>
  ) : (
    <Link href={href} className={styles.link} onClick={handleClick}>
      {page}
    </Link>
  );
}
