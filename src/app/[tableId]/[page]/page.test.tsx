import { expect, vi, describe, it, beforeEach } from 'vitest';
import Table, { generateMetadata, generateStaticParams } from './page';
import getTableMetadata from '@/app/helpers/get-table-metadata';
import getTableData from '@/shared/get-table-data';
import getTablesMetadata from '@/shared/get-tables-metadata';
import { generateIndexationMetadata, generateJsonLd } from '@/app/helpers/generate-metadata';
import { notFound } from 'next/navigation';
import TableContent from './table-content';

vi.mock('@/app/helpers/get-table-metadata');
vi.mock('@/shared/get-table-data');
vi.mock('@/shared/get-tables-metadata');
vi.mock('@/app/helpers/generate-metadata');
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));
vi.mock('./table-content', () => ({
  default: vi.fn(() => null),
}));
vi.mock('@/app/environment', () => ({
  default: {
    NEXT_PUBLIC_SITE: 'https://test.com',
  },
}));
vi.mock('@/app/constants', () => ({
  PER_PAGE: 20,
}));

describe('Table Page', () => {
  const mockTableMetadata = {
    id: 'test-table',
    title: 'Test Table',
    size: 100,
  };

  const mockTableData = Array.from({ length: 50 }, (_, i) => ({ id: `${i}`, name: `Row ${i}` }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Table component', () => {
    it('renders TableContent with correct data for page 1', async () => {
      vi.mocked(getTableMetadata).mockResolvedValue(mockTableMetadata as any);
      vi.mocked(getTableData).mockResolvedValue(mockTableData as any);
      vi.mocked(generateJsonLd).mockReturnValue({ '@context': 'https://schema.org' } as any);

      const params = Promise.resolve({ tableId: 'test-table', page: '1' });
      await Table({ params });

      expect(getTableMetadata).toHaveBeenCalledWith('test-table');
      expect(getTableData).toHaveBeenCalledWith(mockTableMetadata);
      expect(TableContent).toHaveBeenCalledWith(
        expect.objectContaining({
          tableMetadata: mockTableMetadata,
          tableData: mockTableData.slice(0, 20),
          page: 1,
          tableId: 'test-table',
          totalRecords: 50,
          jsonLd: { '@context': 'https://schema.org' },
        }),
        expect.anything()
      );
    });

    it('renders TableContent without jsonLd for page 2', async () => {
      vi.mocked(getTableMetadata).mockResolvedValue(mockTableMetadata as any);
      vi.mocked(getTableData).mockResolvedValue(mockTableData as any);

      const params = Promise.resolve({ tableId: 'test-table', page: '2' });
      await Table({ params });

      expect(TableContent).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          jsonLd: null,
          tableData: mockTableData.slice(20, 40),
        }),
        expect.anything()
      );
    });

    it('calls notFound when no data is found', async () => {
      vi.mocked(getTableMetadata).mockResolvedValue(mockTableMetadata as any);
      vi.mocked(getTableData).mockResolvedValue([]);

      const params = Promise.resolve({ tableId: 'test-table', page: '1' });
      await Table({ params });

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('generateMetadata', () => {
    it('returns correct metadata including canonical URL', async () => {
      vi.mocked(getTableMetadata).mockResolvedValue(mockTableMetadata as any);
      vi.mocked(generateIndexationMetadata).mockReturnValue({ title: 'Meta Title' } as any);

      const params = Promise.resolve({ tableId: 'test-table', page: '1' });
      const metadata = await generateMetadata({ params });

      expect(generateIndexationMetadata).toHaveBeenCalledWith(mockTableMetadata, 1);
      expect(metadata).toEqual({
        title: 'Meta Title',
        alternates: {
          canonical: 'https://test.com/test-table/1/',
        },
      });
    });
  });

  describe('generateStaticParams', () => {
    it('returns params for all pages of all tables', async () => {
      vi.mocked(getTablesMetadata).mockResolvedValue([
        { id: 'table-1', size: 25 },
        { id: 'table-2', size: 10 },
      ] as any);

      const params = await generateStaticParams();

      expect(params).toEqual([
        { tableId: 'table-1', page: '1' },
        { tableId: 'table-1', page: '2' },
        { tableId: 'table-2', page: '1' },
      ]);
    });
  });
});
