import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  });

  it('should delete documents from the correct collection with the correct filter', async () => {
    await deleteFromTypesense('1897-PZZ');

    expect(typesense.collections).toHaveBeenCalledWith('unstructured_uk');
    expect(
      typesense.collections('unstructured_uk').documents,
    ).toHaveBeenCalled();
    expect(
      typesense.collections('unstructured_uk').documents().delete,
    ).toHaveBeenCalledWith({
      filter_by: 'tableId:1897-PZZ',
    });
  });

  it('should handle different locales correctly', async () => {
    await deleteFromTypesense('1919-PL');

    expect(typesense.collections).toHaveBeenCalledWith('unstructured_pl');
    expect(
      typesense.collections('unstructured_pl').documents().delete,
    ).toHaveBeenCalledWith({
      filter_by: 'tableId:1919-PL',
    });
  });
});
