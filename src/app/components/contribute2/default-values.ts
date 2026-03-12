import { restoreAuthorIdentity } from './local-storage';
import type { ContributeForm2Values } from './types';

function restoreContributePageState() {
  return restoreAuthorIdentity();
}

const BLANK_VALUES = {
  archiveItems: [],
  authorEmail: '',
  authorGithubUsername: '',
  authorName: '',
  id: '',
  location: '',
  sources: [],
  table: null,
  tableLocale: null,
  title: '',
  yearsRange: [],
};

export default function getDefaultValues(
  otherDefaultValues: Partial<ContributeForm2Values> = {},
): ContributeForm2Values {
  const restored = restoreContributePageState();
  if (restored) {
    return {
      ...BLANK_VALUES,
      ...restored,
      ...otherDefaultValues,
    } as ContributeForm2Values;
  }
  return {
    ...BLANK_VALUES,
    ...otherDefaultValues,
  } as ContributeForm2Values;
}
