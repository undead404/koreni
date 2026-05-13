import path from 'node:path';

const RECORDS_FOLDER = path.join('data', 'records', '');

export default function getTableIdFromFile(filePath: string): string | null {
  if (!filePath.endsWith('.yaml')) {
    return null;
  }
  if (!filePath.includes(RECORDS_FOLDER)) {
    return null;
  }
  const cleanFileName = filePath.split(path.sep).pop();
  if (!cleanFileName) {
    throw new Error('Filename not found');
  }
  const filenameWithoutExtension = cleanFileName.replace('.yaml', '');
  if (filenameWithoutExtension === cleanFileName) {
    throw new Error('The file is not YAML');
  }
  return filenameWithoutExtension;
}
