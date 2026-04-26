import { describe, expect, it } from 'vitest';

import { convertArrayToCsvBase64 } from './convert-array-to-csv-base64.js';

describe('convertArrayToCsvBase64', () => {
  it('should convert an array of objects to a base64 encoded CSV string', async () => {
    const columns = ['name', 'age'];
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];

    const result = await convertArrayToCsvBase64(columns, data);
    const decoded = Buffer.from(result, 'base64').toString('utf8');

    expect(decoded).toBe('name,age\nAlice,30\nBob,25\n');
  });

  it('should handle empty data arrays by returning just the headers', async () => {
    const columns = ['name', 'age'];
    const data: Record<string, unknown>[] = [];

    const result = await convertArrayToCsvBase64(columns, data);
    const decoded = Buffer.from(result, 'base64').toString('utf8');

    expect(decoded).toBe('name,age\n');
  });

  it('should handle special characters correctly (commas, newlines, quotes)', async () => {
    const columns = ['text'];
    const data = [
      { text: 'hello, world' },
      { text: 'line1\nline2' },
      { text: '"quotes"' },
    ];

    const result = await convertArrayToCsvBase64(columns, data);
    const decoded = Buffer.from(result, 'base64').toString('utf8');

    expect(decoded).toBe(
      'text\n"hello, world"\n"line1\nline2"\n"""quotes"""\n',
    );
  });
});
