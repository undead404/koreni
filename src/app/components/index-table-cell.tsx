'use client';

import { useEffect, useMemo, useRef } from 'react';

import scrollOnce from '../helpers/scroll-once';

import styles from './index-table-cell.module.css';

export default function IndexTableCell({
  isInTarget,
  matchedTokens,
  value,
  isRowHeader,
}: {
  isInTarget?: boolean;
  matchedTokens: string[];
  value: unknown;
  isRowHeader?: boolean;
}) {
  const cellReference = useRef<HTMLTableCellElement>(null);
  const targetMarkReference = useRef<HTMLElement>(null);

  const stringValue =
    value == null
      ? ''
      : typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : '';

  // 1. Compute highlights synchronously during render. No useEffect lag.
  const renderedContent = useMemo(() => {
    if (
      stringValue.startsWith('http://') ||
      stringValue.startsWith('https://')
    ) {
      return (
        <a
          href={stringValue}
          aria-label="Відкрити посилання"
          target="_blank"
          rel="noopener noreferrer"
        >
          {stringValue}
        </a>
      );
    }

    if (matchedTokens.length === 0 || !stringValue) return stringValue;

    const regex = new RegExp(`(${matchedTokens.join('|')})`, 'gi');
    const parts = stringValue.split(regex);

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
  }, [matchedTokens, stringValue, isInTarget]);

  // 2. Trigger scroll when the target is mounted and rendered
  useEffect(() => {
    if (isInTarget && targetMarkReference.current) {
      scrollOnce(targetMarkReference.current);
    }
  }, [isInTarget, renderedContent]);

  if (isRowHeader) {
    return (
      <th
        scope="row"
        ref={cellReference as React.RefObject<HTMLTableCellElement>}
      >
        {renderedContent}
      </th>
    );
  }

  return <td ref={cellReference}>{renderedContent}</td>;
}
