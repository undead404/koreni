'use client';
import { useEffect, useState } from 'react';

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
  const [element, setElement] = useState<HTMLTableCellElement | null>(null);
  const [tweakedValue, setTweakedValue] = useState(value);
  useEffect(() => {
    if (!matchedTokens?.length) {
      return;
    }
    // Highlight matched tokens with <mark> tag
    let highlighted = value;
    for (const token of matchedTokens) {
      highlighted = highlighted.replaceAll(token, (match) => {
        return `<mark class="${styles.mark}">${match}</mark>`;
      });
    }
    setTweakedValue(highlighted);
  }, [matchedTokens, value]);

  useEffect(() => {
    if (!isInTarget || value === tweakedValue || !element) {
      return;
    }
    const mark = element.querySelector('mark');
    scrollOnce(mark);
  }, [element, isInTarget, tweakedValue, value]);

  return (
    <td
      dangerouslySetInnerHTML={{ __html: tweakedValue }}
      ref={setElement}
      className={`${value.length < 80 ? 'text-nowrap' : styles.verbose} ${value.startsWith('http') ? 'break-word' : ''}`}
    />
  );
}
