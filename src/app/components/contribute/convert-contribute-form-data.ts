import { ContributeFormValues } from './types';

export default function convertContributeFormData(
  data: ContributeFormValues,
  { isRange }: { isRange: boolean },
) {
  const convertedData = new FormData();
  convertedData.append('table', data.table![0] as Blob);
  convertedData.append('id', data.id);
  convertedData.append('authorName', data.authorName);
  convertedData.append('authorEmail', data.authorEmail);
  convertedData.append('authorGithubUsername', data.authorGithubUsername);
  convertedData.append(
    'yearsRange',
    isRange
      ? JSON.stringify([data.yearStart, data.yearEnd])
      : JSON.stringify([data.year]),
  );
  convertedData.append(
    'archiveItems',
    JSON.stringify(data.archiveItems.split('\n')),
  );
  convertedData.append(
    'location',
    JSON.stringify(data.location.split(',').map(Number)),
  );
  convertedData.append('sources', JSON.stringify(data.sources.split('\n')));
  convertedData.append('title', data.title);
  convertedData.append('tableLocale', data.tableLocale as string);
  return convertedData;
}
