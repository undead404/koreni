import { restoreAuthorIdentity } from './local-storage';
import type { ContributeFormValues } from './types';

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
  otherDefaultValues: Partial<ContributeFormValues> = {},
): ContributeFormValues {
  const restored = restoreContributePageState();
  if (restored) {
    return {
      ...BLANK_VALUES,
      ...restored,
      ...otherDefaultValues,
    } as ContributeFormValues;
  }
  return {
    ...BLANK_VALUES,
    ...otherDefaultValues,
  } as ContributeFormValues;
}
