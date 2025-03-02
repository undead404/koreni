"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

export default function IndexTableValue({
  onMatch,
  value,
}: {
  onMatch: (element: HTMLElement) => void;
  value: string;
}) {
  const searchParams = useSearchParams();
  const highlightedValue = useMemo(() => {
    const matchedTokensParam = searchParams.get("matched_tokens");
    if (!matchedTokensParam) {
        return value;
    }
    const matchedTokens = matchedTokensParam.split(",") || [];
    // Highlight matched tokens with <mark> tag
    return matchedTokens.reduce((acc, token) => {
      return acc.replace(new RegExp(token, "gi"), `<mark>${token}</mark>`);
    }, value);
  }, [value, searchParams]);
  const ref = useRef<HTMLTableDataCellElement>(null);
  useEffect(() => {
    if (ref.current && highlightedValue.includes("<mark>")) {
      onMatch(ref.current);
    }
  }, [highlightedValue, onMatch]);

  return (
    <td dangerouslySetInnerHTML={{ __html: highlightedValue }} ref={ref} />
  );
}
