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
  value: unknown;
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

  const isUrl =
    stringValue.startsWith('http://') || stringValue.startsWith('https://');

  // 1. Compute highlights synchronously during render. No useEffect lag.
  const renderedContent = useMemo(() => {
    let text = stringValue;
    if (isUrl) {
      try {
        const url = new URL(stringValue);
        text = url.hostname;
      } catch {
        // Ignore invalid URLs
      }
      return (
        <a
          href={stringValue}
          aria-label="Відкрити посилання"
          target="_blank"
          rel="noopener noreferrer"
        >
          {text}
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
  }, [isInTarget, isUrl, matchedTokens, stringValue]);

  // 2. Trigger scroll when the target is mounted and rendered
  useEffect(() => {
    if (isInTarget && targetMarkReference.current) {
      scrollOnce(targetMarkReference.current);
    }
  }, [isInTarget, renderedContent]);

  return (
    <td ref={cellReference} title={isUrl ? stringValue : undefined}>
      {renderedContent}
    </td>
  );
}
