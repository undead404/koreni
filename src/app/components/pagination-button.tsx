'use client';

import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
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
  const posthog = usePostHog();
  const handleClick = useCallback(() => {
    posthog.capture('pagination_clicked', {
      target_page: page,
      destination_url: href,
    });
  }, [href, page, posthog]);

  return isCurrent ? (
    <span className={styles.currentPage}>{page}</span>
  ) : (
    <Link href={href} className={styles.link} onClick={handleClick}>
      {page}
    </Link>
  );
}
