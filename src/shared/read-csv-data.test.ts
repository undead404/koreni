import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import readCsv from './read-csv-data';

vi.mock('node:fs', () => {
  const mockCreateReadStream = vi.fn();
  return {
    createReadStream: mockCreateReadStream,
    default: {
      createReadStream: mockCreateReadStream,
    },
  };
});

describe('readCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse CSV data and remove empty string keys', async () => {
    // The trailing comma on the header row creates an empty string key ("")
    const csvData = 'id,name,\n1,John,dropme\n2,Jane,dropmetoo';
    const mockStream = Readable.from([csvData]);
    
    vi.mocked(createReadStream).mockReturnValue(mockStream as any);

    const result = await readCsv('fake-path.csv');

    expect(createReadStream).toHaveBeenCalledWith('fake-path.csv');
    expect(result).toEqual([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);
  });

  it('should reject the promise if stream creation fails', async () => {
    vi.mocked(createReadStream).mockImplementation(() => {
      throw new Error('File not found');
    });

    await expect(readCsv('missing.csv')).rejects.toThrow('File not found');
  });
});
