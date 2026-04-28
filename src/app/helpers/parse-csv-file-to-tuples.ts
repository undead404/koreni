import Papa from 'papaparse';

export default function parseCsvToTuples(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][];

        // Superior heuristic: detect the Unicode replacement character
        const hasEncodingError = data.some((row) =>
          row.some((cell) => cell.includes('\uFFFD')),
        );

        if (hasEncodingError) {
          reject(
            new Error(
              'File encoding error: Invalid byte sequence detected. Expected UTF-8.',
            ),
          );
          return;
        }

        resolve(data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}
