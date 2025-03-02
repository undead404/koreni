import { createReadStream } from "node:fs";
import Papa from "papaparse";

export default function readCsv(
  filePath: string
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const fileStream = createReadStream(filePath);

    Papa.parse<Record<string, unknown>>(fileStream, {
      complete: (results) => {
        resolve(results.data.map(row => {
            const copy = { ...row };
            delete copy[""];
            return copy;
        }));
      },
      dynamicTyping: false,
      error: (error) => {
        reject(error);
      },
      header: true,
      skipEmptyLines: true,
    });
  });
}
