import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import type { SearchParametersHack } from '../schemas/search-parameters';

export default function SearchParametersListener() {
  const searchParameters = useSearchParams();
  useEffect(() => {
    globalThis.dispatchEvent(
      new CustomEvent<SearchParametersHack>('search_parameters', {
        detail: {
          matchedTokens: searchParameters.get('matched_tokens'),
          showRow: searchParameters.get('show_row'),
        },
      }),
    );
  }, [searchParameters]);
  return null; // This component doesn't render anything
}
