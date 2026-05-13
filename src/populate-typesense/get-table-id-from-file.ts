import path from 'node:path';

const RECORDS_FOLDER = path.join('data', 'records', '');

export default function getTableIdFromFile(filePath: string): string | null {
  if (!filePath.endsWith('.csv')) {
    return null;
  }
  if (!filePath.includes(RECORDS_FOLDER)) {
    return null;
  }
  const cleanFileName = filePath.split(path.sep).pop();
  if (!cleanFileName) {
    throw new Error('Filename not found');
  }
  const filenameWithoutExtension = cleanFileName.replace('.csv', '');
  if (filenameWithoutExtension === cleanFileName) {
    throw new Error('File is not CSV');
  }
  return filenameWithoutExtension;
}
