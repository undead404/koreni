'use client';

import { Suspense, useCallback, useState } from 'react';

import type { IndexationTable } from '@koreni/shared/schemas/indexation-table';

import IndexTable from './index-table';
import TableParameterReader from './table-parameter-reader';

export interface IndexTableWithParametersProperties {
  data: Record<string, unknown>[];
  locale: IndexationTable['tableLocale'];
  page: number;
  tableId: string;
}

/**
 * Wrapper component that manages URL parameter reading and state.
 * Isolates useSearchParams() in TableParameterReader (inside Suspense) so that
 * IndexTable can be included in static HTML without a Suspense boundary.
 *
 * Architecture:
 * - IndexTable renders immediately with initial state (empty matchedTokens, null targetRowId)
 * - TableParameterReader is inside <Suspense> and reads useSearchParams() after hydration
 * - When parameters arrive, state updates and IndexTable re-renders with real values
 */
export default function IndexTableWithParameters({
  data,
  locale,
  page,
  tableId,
}: IndexTableWithParametersProperties) {
  const [matchedTokens, setMatchedTokens] = useState<string[]>([]);
  const [targetRowId, setTargetRowId] = useState<string | null>(null);

  const handleParametersChange = useCallback(
    (parameters: { matchedTokens: string[]; targetRowId: string | null }) => {
      setMatchedTokens(parameters.matchedTokens);
      setTargetRowId(parameters.targetRowId);
    },
    [],
  );

  return (
    <>
      <IndexTable
        data={data}
        locale={locale}
        matchedTokens={matchedTokens}
        page={page}
        tableId={tableId}
        targetRowId={targetRowId}
      />
      <Suspense fallback={null}>
        <TableParameterReader onParametersChange={handleParametersChange} />
      </Suspense>
    </>
  );
}
