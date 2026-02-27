import { parse } from 'csv-parse';

export default async function calculateCsvLinesSize(
  file: File,
): Promise<number> {
  const buffer = Buffer.from(await file.arrayBuffer());
  let count = 0;

  return new Promise((resolve, reject) => {
    const parser = parse({ columns: true }); // Assumes first row is header
    parser.on('readable', () => {
      while (parser.read() !== null) count++;
    });
    parser.on('error', reject);
    parser.on('end', () => resolve(count));

    parser.write(buffer);
    parser.end();
  });
}
