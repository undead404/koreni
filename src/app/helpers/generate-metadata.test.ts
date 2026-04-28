import { describe, expect, it, vi } from 'vitest';

import { IndexationTable } from '@/shared/schemas/indexation-table';

import {
  generateIndexationMetadata,
  generateJsonLd,
} from './generate-metadata';

vi.mock('../environment', () => ({
  default: {
    NEXT_PUBLIC_SITE: 'https://example.com',
  },
}));

vi.mock('../constants', () => ({
  PER_PAGE: 10,
}));

const mockTable: IndexationTable = {
  id: 'test-table',
  title: 'Test Location',
  size: 25,
  date: new Date('2023-01-01'),
  authorName: 'John Doe',
  authorEmail: 'john@example.com',
  sources: ['http://source1.com', 'http://source2.com'],
  tableLocale: 'uk',
  tableFilePath: 'data/test.csv',
  archiveItems: ['F1-O1-D1'],
  yearsRange: [1900, 1910],
  location: [50.45, 30.52],
};

interface JsonLdGraphNode {
  '@type': string;
  name?: string;
  creator?: { name: string; email: string };
  spatialCoverage?: { geo: { latitude: number; longitude: number } };
  distribution?: { name: string }[];
  datePublished?: string;
}

interface JsonLdDocument {
  '@context': string;
  '@graph': JsonLdGraphNode[];
}

describe('generate-metadata', () => {
  describe('generateIndexationMetadata', () => {
    it('generates correct metadata for page 1', () => {
      const metadata = generateIndexationMetadata(mockTable, 1);

      expect(metadata.title).toBe('Test Location');
      expect(metadata.description).toContain('Test Location (1900–1910)');
      expect(metadata.description).toContain('Індексовано 25 записів.');
      expect(metadata.description).toContain('F1-O1-D1');

      expect(metadata.alternates?.canonical).toBe('/test-table/1/');
      expect(metadata.alternates?.types?.prev).toBeNull();
      expect(metadata.alternates?.types?.next).toBe('/test-table/2/');
    });

    it('generates correct metadata for page 2', () => {
      const metadata = generateIndexationMetadata(mockTable, 2);

      expect(metadata.alternates?.types?.prev).toBe('/test-table/1/');

      expect(metadata.alternates?.types?.next).toBe('/test-table/3/');
    });

    it('generates correct metadata for last page', () => {
      const metadata = generateIndexationMetadata(mockTable, 3);

      expect(metadata.alternates?.types?.prev).toBe('/test-table/2/');

      expect(metadata.alternates?.types?.next).toBeNull();
    });

    it('handles missing optional fields gracefully', () => {
      const minimalTable = {
        id: 'minimal-table',
        title: 'Minimal Location',
        size: 0,
        date: new Date('invalid-date'),
        tableLocale: 'ru',
        tableFilePath: 'data/minimal.csv',
      } as IndexationTable;

      const metadata = generateIndexationMetadata(minimalTable, 1);
      expect(metadata.title).toBe('Minimal Location');
      expect(metadata.description).toBe(
        'Minimal Location.  Таблиця сформована на основі справ: undefined.',
      );
      expect(metadata.authors).toBeUndefined();
      // @ts-expect-error - openGraph is defined in our output
      expect(metadata.openGraph?.publishedTime).toBeUndefined();
    });
  });

  describe('generateJsonLd', () => {
    it('generates valid JSON-LD string', () => {
      const jsonLdString = generateJsonLd(mockTable);
      const jsonLd = JSON.parse(jsonLdString) as JsonLdDocument;

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@graph']).toHaveLength(2);

      const webpage = jsonLd['@graph'].find((g) => g['@type'] === 'WebPage');
      expect(webpage).toBeDefined();
      expect(webpage?.name).toBe('Test Location');

      const dataset = jsonLd['@graph'].find((g) => g['@type'] === 'Dataset');
      expect(dataset).toBeDefined();
      expect(dataset?.name).toBe('Test Location');
      expect(dataset?.creator?.name).toBe('John Doe');
      expect(dataset?.creator?.email).toBe('john@example.com');
      expect(dataset?.spatialCoverage?.geo.latitude).toBe(50.45);
      expect(dataset?.spatialCoverage?.geo.longitude).toBe(30.52);
      expect(dataset?.distribution?.[0]?.name).toBe('test.csv');
    });

    it('handles missing optional fields in JSON-LD', () => {
      const minimalTable = {
        id: 'minimal-table',
        title: 'Minimal Location',
        size: 0,
        date: new Date('invalid-date'),
        tableLocale: 'ru',
        tableFilePath: 'data/minimal.csv',
      } as IndexationTable;

      const jsonLdString = generateJsonLd(minimalTable);
      const jsonLd = JSON.parse(jsonLdString) as JsonLdDocument;

      const dataset = jsonLd['@graph'].find((g) => g['@type'] === 'Dataset');
      expect(dataset?.creator).toBeUndefined();
      expect(dataset?.spatialCoverage).toBeUndefined();
      expect(dataset?.datePublished).toBeUndefined();
    });
  });
});
