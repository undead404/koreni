export default function convertImportFormData(
  data: FormData,
  { isRange }: { isRange: boolean },
) {
  const convertedData = new FormData();
  convertedData.append('table', data.get('table') as Blob);
  convertedData.append('id', data.get('id') as string);
  convertedData.append('authorName', data.get('authorName') as string);
  convertedData.append('authorEmail', data.get('authorEmail') as string);
  convertedData.append(
    'authorGithubUsername',
    data.get('authorGithubUsername') as string,
  );
  convertedData.append(
    'yearsRange',
    isRange
      ? JSON.stringify(
          [data.get('yearStart') as string, data.get('yearEnd') as string].map(
            Number,
          ),
        )
      : JSON.stringify([data.get('year') as string].map(Number)),
  );
  convertedData.append(
    'archiveItems',
    JSON.stringify((data.get('archiveItems')! as string).split('\n')),
  );
  convertedData.append(
    'location',
    JSON.stringify((data.get('location') as string).split(',').map(Number)),
  );
  convertedData.append(
    'sources',
    JSON.stringify((data.get('sources') as string).split('\n')),
  );
  convertedData.append('title', data.get('title') as string);
  convertedData.append('tableLocale', data.get('tableLocale') as string);
  return convertedData;
}
