import { createContext, useContext } from 'react';

import type { ContributeFormProperties } from '../contribute/types';

export const KnownLocationsContext = createContext<
  ContributeFormProperties['knownLocations']
>([]);

export function useKnownLocations() {
  return useContext(KnownLocationsContext);
}
