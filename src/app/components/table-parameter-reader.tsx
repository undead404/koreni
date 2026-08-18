'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import escapeRegExp from '../helpers/escape-reg-exp';

export interface TableParameterReaderProperties {
  onParametersChange: (parameters: {
    matchedTokens: string[];
    targetRowId: string | null;
  }) => void;
}

/**
 * Reads URL search parameters (matched_tokens, show_row) and notifies parent
 * component via callback. This component is wrapped in <Suspense> to isolate
 * the useSearchParams() call, allowing the table to be included in static HTML.
 */
export default function TableParameterReader({
  onParametersChange,
}: TableParameterReaderProperties) {
  const searchParameters = useSearchParams();

  useEffect(() => {
    const rawTokens = searchParameters.get('matched_tokens');
    const matchedTokens = rawTokens
      ? rawTokens
          .split(',')
          .map((item: string) => escapeRegExp(item))
          .filter(Boolean)
      : [];

    const targetRowId = searchParameters.get('show_row');

    onParametersChange({
      matchedTokens,
      targetRowId,
    });
  }, [searchParameters, onParametersChange]);

  return null; // This component doesn't render anything
}
