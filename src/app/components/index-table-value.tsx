'use client';
import { useMemo, useRef } from 'react';

import styles from './index-table-value.module.css';

export default function IndexTableValue({
  matchedTokens,
  value,
}: {
  matchedTokens: string[];
  value: string;
}) {
  const highlightedValue = useMemo(() => {
    if (!matchedTokens?.length) {
      return value;
    }
    // Highlight matched tokens with <mark> tag
    let highlighted = value;
    for (const token of matchedTokens) {
      highlighted = highlighted.replaceAll(
        new RegExp(token, 'gi'),
        (match) => `<mark class="${styles.mark}">${match}</mark>`,
      );
    }
    return highlighted;
  }, [matchedTokens, value]);
  const reference = useRef<HTMLTableCellElement>(null);

  return (
    <td
      dangerouslySetInnerHTML={{ __html: highlightedValue }}
      ref={reference}
    />
  );
}
