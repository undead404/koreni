import IndexTableCell from './index-table-cell';

export interface IndexTableRowProperties {
  data: Record<string, unknown>;
  id: string;
  isTarget: boolean;
  matchedTokens: string[];
}

export default function IndexTableRow({
  id,
  isTarget,
  data,
  matchedTokens,
}: IndexTableRowProperties) {
  return (
    <tr id={id}>
      {Object.values(data).map((value, index) => (
        <IndexTableCell
          key={index}
          isInTarget={isTarget}
          matchedTokens={matchedTokens}
          value={`${/* eslint-disable @typescript-eslint/no-explicit-any */ value as any}`}
        />
      ))}
    </tr>
  );
}
