import Papa from 'papaparse';

export interface TableData {
  columns: string[];
  data: Record<string, unknown>[];
}

export default function parseCsvToObjects(file: File): Promise<TableData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields) {
          reject(new Error('No columns found'));
          return;
        }
        resolve({
          columns: results.meta.fields,
          data: results.data as Record<string, unknown>[],
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}
