"use client";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef } from "react";

import styles from "./index-table-value.module.css";

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
    return matchedTokens.reduce((acc, token) => {
      return acc.replace(
        new RegExp(token, "gi"),
        `<mark class="${styles.mark}">${token}</mark>`
      );
    }, value);
  }, [matchedTokens, value]);
  const ref = useRef<HTMLTableDataCellElement>(null);

  return (
    <td dangerouslySetInnerHTML={{ __html: highlightedValue }} ref={ref} />
  );
}
