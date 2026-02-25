import { useEffect, useState } from 'react';

import {
  SearchParametersHack,
  searchParametersSchema,
} from '../schemas/search-parameters';

export default function useSearchParametersHack() {
  const [searchParameters, setSearchParameters] =
    useState<SearchParametersHack>({
      matchedTokens: null,
      showRow: null,
    });
  useEffect(() => {
    globalThis.addEventListener('search_parameters', (event) => {
      setSearchParameters(
        searchParametersSchema.parse((event as CustomEvent<unknown>).detail),
      );
    });
  }, []);
  return searchParameters;
}
