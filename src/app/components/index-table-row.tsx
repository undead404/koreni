import { useEffect, useRef } from 'react';

import IndexTableCell from './index-table-cell';

export interface IndexTableRowProperties {
  data: Record<string, unknown>;
  id: string;
  isTarget: boolean;
  matchedTokens: string[];
  onScrollMissed?: () => void;
}

export default function IndexTableRow({
  id,
  isTarget,
  data,
  matchedTokens,
  onScrollMissed,
}: IndexTableRowProperties) {
  const hasMarkReference = useRef(false);

  // FM2: After render, check if any cell in the target row has a mark
  useEffect(() => {
    if (!isTarget || !onScrollMissed) return;

    // Check if any mark element exists in this row
    const rowElement = document.querySelector(`#${id}`);
    const hasAnyMark = rowElement?.querySelector('mark') !== null;

    if (!hasAnyMark && !hasMarkReference.current) {
      hasMarkReference.current = true;
      onScrollMissed();
    }
  }, [isTarget, onScrollMissed, id, matchedTokens]);

  return (
    <tr id={id}>
      {Object.values(data).map((value, index) => (
        <IndexTableCell
          key={index}
          isInTarget={isTarget}
          matchedTokens={matchedTokens}
          value={value}
        />
      ))}
    </tr>
  );
}
