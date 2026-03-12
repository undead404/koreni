import Papa from 'papaparse';

export default function parseCsvToTuples(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as string[][]);
      },
      error: (error) => reject(error),
    });
  });
}
