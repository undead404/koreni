import { createContext, useContext } from 'react';

import { ContributeFormProperties } from './types';

export const KnownLocationsContext = createContext<
  ContributeFormProperties['knownLocations']
>([]);

export function useKnownLocations() {
  return useContext(KnownLocationsContext);
}
