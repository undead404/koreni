import { describe, expect, it, vi } from 'vitest';

import { IndexationTable } from './schemas/indexation-table';
import getTableData from './get-table-data';
import readCsv from './read-csv-data';

vi.mock('./read-csv-data', () => ({
  default: vi.fn(),
}));

describe('getTableData', () => {
  it('should call readCsv with the correct file path and return the data', async () => {
    const mockData = [{ id: '1', name: 'Test Row' }];
    vi.mocked(readCsv).mockResolvedValue(mockData);

    const mockMetadata = {
      tableFilePath: 'data/test-file.csv',
    } as IndexationTable;

    const result = await getTableData(mockMetadata);

    expect(readCsv).toHaveBeenCalledWith('data/test-file.csv');
    expect(result).toEqual(mockData);
  });
});
