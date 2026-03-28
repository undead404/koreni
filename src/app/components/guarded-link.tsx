'use client';
import Link, { type LinkProps } from 'next/link';
import { type MouseEvent, type ReactNode, useCallback } from 'react';

export interface GuardedLinkProperties extends LinkProps {
  children: ReactNode;
  isDirty: boolean;
}

export const GuardedLink = ({
  href,
  isDirty,
  children,
  ...properties
}: GuardedLinkProperties) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        isDirty &&
        !globalThis.confirm('Незбережені дані будуть втрачені. Продовжити?')
      ) {
        event.preventDefault();
      }
    },
    [isDirty],
  );

  return (
    <Link href={href} onClick={handleClick} {...properties}>
      {children}
    </Link>
  );
};
