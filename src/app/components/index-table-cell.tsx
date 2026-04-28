'use client';

import { useEffect, useMemo, useRef } from 'react';

import scrollOnce from '../helpers/scroll-once';

import styles from './index-table-cell.module.css';

export default function IndexTableCell({
  isInTarget,
  matchedTokens,
  value,
}: {
  isInTarget?: boolean;
  matchedTokens: string[];
  value: string;
}) {
  const cellReference = useRef<HTMLTableCellElement>(null);
  const targetMarkReference = useRef<HTMLElement>(null);

  // 1. Compute highlights synchronously during render. No useEffect lag.
  const renderedContent = useMemo(() => {
    if (matchedTokens.length === 0 || !value) return value;

    const regex = new RegExp(`(${matchedTokens.join('|')})`, 'gi');
    const parts = value.split(regex);

    return parts.map((part, index) => {
      const isMatch = matchedTokens.some(
        (token) => token.toLowerCase() === part.toLowerCase(),
      );

      if (isMatch) {
        return (
          <mark
            key={index}
            // Attach the ref only if this row is the intended scroll target
            ref={isInTarget ? targetMarkReference : null}
            className={styles.mark}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  }, [matchedTokens, value, isInTarget]);

  // 2. Trigger scroll when the target is mounted and rendered
  useEffect(() => {
    if (isInTarget && targetMarkReference.current) {
      scrollOnce(targetMarkReference.current);
    }
  }, [isInTarget, renderedContent]);

  // 3. Removed utility classes in favor of deterministic CSS module logic
  const className = [
    value.length < 80 ? styles.textNowrap : styles.verbose,
    value.startsWith('http') ? styles.breakWord : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td ref={cellReference} className={className}>
      {renderedContent}
    </td>
  );
}
