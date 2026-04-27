import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

import deleteFromTypesense from './delete-from-typesense';
import typesense from './typesense';

vi.mock('./typesense', () => {
  const deleteMock = vi.fn();
  const documentsMock = vi.fn(() => ({ delete: deleteMock }));
  const collectionsMock = vi.fn(() => ({ documents: documentsMock }));
  
  return {
    default: {
      collections: collectionsMock,
    },
  };
});

describe('deleteFromTypesense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should delete documents from the correct collection with the correct filter', async () => {
    const mockTable = {
      id: '1897-PZZ',
      tableLocale: 'uk',
    } as IndexationTable;

    await deleteFromTypesense(mockTable);

    expect(console.log).toHaveBeenCalledWith('Deleting 1897-PZZ');
    expect(typesense.collections).toHaveBeenCalledWith('unstructured_uk');
    expect(typesense.collections('unstructured_uk').documents).toHaveBeenCalled();
    expect(
      typesense.collections('unstructured_uk').documents().delete,
    ).toHaveBeenCalledWith({
      filter_by: 'table_id:1897-PZZ',
    });
  });

  it('should handle different locales correctly', async () => {
    const mockTable = {
      id: '1919-PL',
      tableLocale: 'pl',
    } as IndexationTable;

    await deleteFromTypesense(mockTable);

    expect(console.log).toHaveBeenCalledWith('Deleting 1919-PL');
    expect(typesense.collections).toHaveBeenCalledWith('unstructured_pl');
    expect(
      typesense.collections('unstructured_pl').documents().delete,
    ).toHaveBeenCalledWith({
      filter_by: 'table_id:1919-PL',
    });
  });
});
