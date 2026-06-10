import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAssetManager } from './use-asset-manager';

vi.mock('../../api/save-image-source', () => ({
  default: vi.fn(),
}));
vi.mock('../../api/split-spread', () => ({
  default: vi.fn(),
}));
vi.mock('../../api/revert-split', () => ({
  default: vi.fn(),
}));

import revertSplit from '../../api/revert-split';
import saveImageSource from '../../api/save-image-source';
import splitSpread from '../../api/split-spread';

const makeFile = (name = 'test.jpg') =>
  new File([''], name, { type: 'image/jpeg' });

describe('useAssetManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles file selection and initialises new fields', () => {
    const { result } = renderHook(() => useAssetManager('proj-1', vi.fn()));

    const file = makeFile();
    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(event);
    });

    expect(result.current.images).toHaveLength(1);
    expect(result.current.images[0].file).toBe(file);
    expect(result.current.images[0].isSplit).toBe(false);
    expect(result.current.images[0].splitCropX).toBeNull();
    expect(typeof result.current.images[0].sourceId).toBe('string');
  });

  it('filters out non-JPEG files on selection', () => {
    const { result } = renderHook(() => useAssetManager('proj-1', vi.fn()));

    const pngFile = new File([''], 'image.png', { type: 'image/png' });
    const event = {
      target: { files: [pngFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(event);
    });

    expect(result.current.images).toHaveLength(0);
  });

  it('uploads via saveImageSource', async () => {
    (saveImageSource as Mock).mockResolvedValue({
      success: true,
      sourceId: 'src-1',
      pageId: 'page-1',
      url: 'https://cdn.example.com/img.jpg',
    });

    const onUploadFinished = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAssetManager('proj-1', onUploadFinished),
    );

    const file = makeFile();
    act(() => {
      result.current.handleFileSelect({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.startUpload();
    });

    expect(saveImageSource).toHaveBeenCalledWith(
      'proj-1',
      expect.any(String),
      expect.any(String),
      file,
      1,
      expect.any(AbortSignal),
    );
    expect(result.current.images[0].status).toBe('success');
    expect(onUploadFinished).toHaveBeenCalledOnce();
  });

  it('marks image as error when upload fails', async () => {
    (saveImageSource as Mock).mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useAssetManager('proj-1', vi.fn()));

    act(() => {
      result.current.handleFileSelect({
        target: { files: [makeFile()] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.startUpload();
    });

    expect(result.current.images[0].status).toBe('error');
  });

  it('handleSplitConfirm updates isSplit and splitCropX on success', async () => {
    (splitSpread as Mock).mockResolvedValue({
      success: true,
      sourceId: 'src-1',
      leftPageId: 'left-1',
      rightPageId: 'right-1',
    });

    const { result } = renderHook(() => useAssetManager('proj-1', vi.fn()));

    act(() => {
      result.current.handleFileSelect({
        target: { files: [makeFile()] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    const imageId = result.current.images[0].id;

    await act(async () => {
      await result.current.handleSplitConfirm(imageId, 0.48);
    });

    await waitFor(() => {
      expect(result.current.images[0].isSplit).toBe(true);
      expect(result.current.images[0].splitCropX).toBe(0.48);
    });
  });

  it('handleSplitConfirm does nothing for unknown imageId', async () => {
    const { result } = renderHook(() => useAssetManager('proj-1', vi.fn()));

    await act(async () => {
      await result.current.handleSplitConfirm('nonexistent', 0.5);
    });

    expect(splitSpread).not.toHaveBeenCalled();
  });

  it('handleRevertSplit resets isSplit and splitCropX on success', async () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    (revertSplit as Mock).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAssetManager('proj-1', vi.fn()));

    act(() => {
      result.current.handleFileSelect({
        target: { files: [makeFile()] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    // Manually set isSplit to true to simulate a prior split
    const imageId = result.current.images[0].id;
    act(() => {
      result.current.images[0].isSplit = true;
      result.current.images[0].splitCropX = 0.5;
    });

    await act(async () => {
      await result.current.handleRevertSplit(imageId);
    });

    await waitFor(() => {
      expect(result.current.images[0].isSplit).toBe(false);
      expect(result.current.images[0].splitCropX).toBeNull();
    });
  });

  it('handleRevertSplit aborts when confirm is cancelled', async () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(false);

    const { result } = renderHook(() => useAssetManager('proj-1', vi.fn()));

    act(() => {
      result.current.handleFileSelect({
        target: { files: [makeFile()] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    const imageId = result.current.images[0].id;

    await act(async () => {
      await result.current.handleRevertSplit(imageId);
    });

    expect(revertSplit).not.toHaveBeenCalled();
  });
});
