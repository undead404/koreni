import { Readable } from 'node:stream';

import { stringify } from 'csv-stringify';

/**
 * Converts an array of objects to a Base64-encoded CSV string asynchronously
 * without blocking the Node.js event loop.
 */
export async function convertArrayToCsvBase64(
  columns: string[],
  data: Record<string, unknown>[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    // Readable.from converts the array into a stream, yielding to the event loop
    const csvStream = Readable.from(data).pipe(
      stringify({
        columns,
        header: true,
      }),
    );

    csvStream.on('data', (chunk: string | Buffer) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    csvStream.on('error', reject);

    csvStream.on('end', () => {
      // Concatenate all buffer chunks and convert to Base64 in one pass
      resolve(Buffer.concat(chunks).toString('base64'));
    });
  });
}
