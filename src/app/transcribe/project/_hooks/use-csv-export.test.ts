import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../../api/get-project-images', () => ({
  default: vi.fn(),
}));

vi.mock('../../api/get-project-schemas', () => ({
  getColumnsBySchemaValue: vi.fn(),
}));

import getProjectImages from '../../api/get-project-images';
import { getColumnsBySchemaValue } from '../../api/get-project-schemas';

import { useCsvExport } from './use-csv-export';

const mockGetProjectImages = vi.mocked(getProjectImages);
const mockGetColumnsBySchemaValue = vi.mocked(getColumnsBySchemaValue);
const mockToastError = vi.mocked(toast.error);

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const STUB_COLUMNS = [
  { id: 'Name', title: 'Name', hint: '', expectedType: 'string' as const },
  { id: 'Age', title: 'Age', hint: '', expectedType: 'string' as const },
];

function makeImage(transcription: string | null | undefined, id = 'img-1') {
  return {
    id,
    projectId: 'proj-1',
    storageKey: 'key',
    url: 'https://example.com/img.jpg',
    pageSequence: 1,
    pageName: null,
    height: 100,
    width: 100,
    createdAt: 0,
    blurhash: null,
    transcription,
  };
}

let downloadedFilename = '';
let capturedCsvContent = '';

const RealBlob = globalThis.Blob;

beforeEach(() => {
  vi.clearAllMocks();
  downloadedFilename = '';
  capturedCsvContent = '';

  vi.stubGlobal(
    'Blob',
    class MockBlob extends RealBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        if (parts && parts.length > 0 && typeof parts[0] === 'string') {
          capturedCsvContent = parts[0];
        }
      }
    },
  );

  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });

  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloadedFilename = this.download;
  });

  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
  vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function getCsvContent(): string {
  return capturedCsvContent;
}

describe('useCsvExport', () => {
  it('returns isExporting false initially', () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );
    expect(result.current.isExporting).toBe(false);
  });

  it('sets isExporting true during export and false after', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);

    let resolveImages!: (v: ReturnType<typeof makeImage>[]) => void;
    mockGetProjectImages.mockReturnValue(
      new Promise((resolve) => {
        resolveImages = resolve;
      }),
    );

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );

    act(() => {
      void result.current.exportCsv();
    });
    expect(result.current.isExporting).toBe(true);

    await act(async () => {
      resolveImages([]);
      await Promise.resolve();
    });
    expect(result.current.isExporting).toBe(false);
  });

  it('calls toast.error on unknown schema type', async () => {
    mockGetColumnsBySchemaValue.mockImplementation(() => {
      throw new TypeError('Unknown schema: bad-type');
    });

    const { result } = renderHook(() => useCsvExport('proj-1', 'bad-type'));
    await act(async () => {
      await result.current.exportCsv();
    });

    expect(mockToastError).toHaveBeenCalledWith('Невідомий тип схеми проекту');
    expect(mockGetProjectImages).not.toHaveBeenCalled();
  });

  it('calls toast.error on network failure fetching images', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );
    await act(async () => {
      await result.current.exportCsv();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      'Не вдалося завантажити зображення проекту',
    );
  });

  it('calls toast.error once when an image has invalid JSON transcription', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockResolvedValue([
      makeImage('not-valid-json'),
      makeImage(JSON.stringify([{ id: VALID_UUID, Name: 'Ivan', Age: '30' }])),
    ]);

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );
    await act(async () => {
      await result.current.exportCsv();
    });

    expect(mockToastError).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledWith(
      'Дані проекту пошкоджені: деякі зображення містять некоректні записи',
    );
  });

  it('calls toast.error once when an image fails Zod validation', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockResolvedValue([
      makeImage(JSON.stringify([{ id: 'not-a-uuid', Name: 'x', Age: '1' }])),
    ]);

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );
    await act(async () => {
      await result.current.exportCsv();
    });

    expect(mockToastError).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledWith(
      'Дані проекту пошкоджені: деякі зображення містять некоректні записи',
    );
  });

  it('does not call toast.error when images have null transcription', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockResolvedValue([
      makeImage(null),
      makeImage(undefined),
    ]);

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );
    await act(async () => {
      await result.current.exportCsv();
    });

    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('triggers download with correct filename', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockResolvedValue([
      makeImage(JSON.stringify([{ id: VALID_UUID, Name: 'Ivan', Age: '30' }])),
    ]);

    const { result } = renderHook(() =>
      useCsvExport('my-project', 'confession-list'),
    );
    await act(async () => {
      await result.current.exportCsv();
    });

    expect(downloadedFilename).toBe('my-project.csv');
  });

  it('does not include the id field in CSV output', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockResolvedValue([
      makeImage(JSON.stringify([{ id: VALID_UUID, Name: 'Ivan', Age: '30' }])),
    ]);

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );
    await act(async () => {
      await result.current.exportCsv();
    });

    const blobText = getCsvContent();
    expect(blobText).not.toContain(VALID_UUID);
    expect(blobText).not.toContain('"id"');
  });

  it('produces correct CSV header and data rows', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockResolvedValue([
      makeImage(
        JSON.stringify([
          { id: VALID_UUID, Name: 'Ivan', Age: '30' },
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            Name: 'Maria',
            Age: '25',
          },
        ]),
      ),
    ]);

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );
    await act(async () => {
      await result.current.exportCsv();
    });

    const blobText = getCsvContent();
    expect(blobText).toContain('Name,Age');
    expect(blobText).toContain('Ivan,30');
    expect(blobText).toContain('Maria,25');
  });

  it('produces header-only CSV when all images have null transcription', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockResolvedValue([makeImage(null)]);

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );
    await act(async () => {
      await result.current.exportCsv();
    });

    const blobText = getCsvContent();
    const lines = blobText.replace('\uFEFF', '').split('\r\n').filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Name,Age');
  });

  it('escapes fields containing commas', async () => {
    mockGetColumnsBySchemaValue.mockReturnValue(STUB_COLUMNS);
    mockGetProjectImages.mockResolvedValue([
      makeImage(
        JSON.stringify([{ id: VALID_UUID, Name: 'Smith, John', Age: '40' }]),
      ),
    ]);

    const { result } = renderHook(() =>
      useCsvExport('proj-1', 'confession-list'),
    );
    await act(async () => {
      await result.current.exportCsv();
    });

    const blobText = getCsvContent();
    expect(blobText).toContain('"Smith, John"');
  });
});
