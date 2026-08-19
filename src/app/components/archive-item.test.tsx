import path from 'node:path';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ArchiveItem from './archive-item';

describe('ArchiveItem', () => {
  const writeTextMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    writeTextMock.mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a known archive with icon copy button, search link, and tooltips', () => {
    render(<ArchiveItem archiveItem="ДАКО-37-3-216" />);

    const codeElement = screen.getByText('ДАКО-37-3-216');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement.tagName).not.toBe('A');
    expect(codeElement.closest('a')).toBeNull();

    const copyButton = screen.getByRole('button', {
      name: 'Скопіювати код справи ДАКО-37-3-216',
    });
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveAttribute(
      'title',
      'Скопіювати код справи ДАКО-37-3-216',
    );

    const searchLink = screen.getByRole('link', {
      name: 'Шукати справу ДАКО-37-3-216 в Качиному інспекторі',
    });
    expect(searchLink).toBeInTheDocument();
    expect(searchLink).toHaveAttribute(
      'title',
      'Шукати справу ДАКО-37-3-216 в Качиному інспекторі',
    );
    expect(searchLink).toHaveAttribute(
      'href',
      `https://inspector.duckarchive.com/search?q=${encodeURIComponent('ДАКО-37-3-216')}`,
    );
    expect(searchLink).toHaveAttribute('target', '_blank');
    expect(searchLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders an unknown archive with exact code and copy button, but no search action', () => {
    render(<ArchiveItem archiveItem="UNKNOWN-123" />);

    const codeElement = screen.getByText('UNKNOWN-123');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement.tagName).not.toBe('A');

    const copyButton = screen.getByRole('button', {
      name: 'Скопіювати код справи UNKNOWN-123',
    });
    expect(copyButton).toBeInTheDocument();

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('calls clipboard API with exact archival code upon copy activation and shows success feedback', async () => {
    render(<ArchiveItem archiveItem="ДАКО-37-3-216" />);

    const copyButton = screen.getByRole('button', {
      name: 'Скопіювати код справи ДАКО-37-3-216',
    });

    act(() => {
      fireEvent.click(copyButton);
    });

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('ДАКО-37-3-216');

    expect(
      await screen.findByText('Код справи ДАКО-37-3-216 скопійовано'),
    ).toBeInTheDocument();
  });

  it('shows error feedback when clipboard write fails while retaining code and copy control', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('Permission denied'));

    render(<ArchiveItem archiveItem="ДАКО-37-3-216" />);

    const copyButton = screen.getByRole('button', {
      name: 'Скопіювати код справи ДАКО-37-3-216',
    });

    act(() => {
      fireEvent.click(copyButton);
    });

    expect(writeTextMock).toHaveBeenCalledWith('ДАКО-37-3-216');
    expect(
      await screen.findByText('Не вдалося скопіювати код справи ДАКО-37-3-216'),
    ).toBeInTheDocument();

    expect(screen.getByText('ДАКО-37-3-216')).toBeInTheDocument();
  });

  it('supports keyboard focus on both controls and retains constant copyButton class', () => {
    render(<ArchiveItem archiveItem="ДАКО-37-3-216" />);

    const copyButton = screen.getByRole('button', {
      name: 'Скопіювати код справи ДАКО-37-3-216',
    });
    const searchLink = screen.getByRole('link', {
      name: 'Шукати справу ДАКО-37-3-216 в Качиному інспекторі',
    });

    copyButton.focus();
    expect(copyButton).toHaveFocus();
    expect(copyButton.className).toContain('copyButton');

    searchLink.focus();
    expect(searchLink).toHaveFocus();
  });

  it('handles missing clipboard API gracefully without crashing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(<ArchiveItem archiveItem="ДАКО-37-3-216" />);

    const copyButton = screen.getByRole('button', {
      name: 'Скопіювати код справи ДАКО-37-3-216',
    });

    act(() => {
      fireEvent.click(copyButton);
    });

    expect(
      await screen.findByText('Не вдалося скопіювати код справи ДАКО-37-3-216'),
    ).toBeInTheDocument();
  });

  it('resets copy status back to idle after timeout', async () => {
    vi.useFakeTimers();

    render(<ArchiveItem archiveItem="ДАКО-37-3-216" />);

    const copyButton = screen.getByRole('button', {
      name: 'Скопіювати код справи ДАКО-37-3-216',
    });

    fireEvent.click(copyButton);
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText('Код справи ДАКО-37-3-216 скопійовано'),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(
      screen.queryByText('Код справи ДАКО-37-3-216 скопійовано'),
    ).toBeNull();

    vi.useRealTimers();
  });

  it('ensures ArchiveItem and its dependencies contain no Node.js filesystem imports', async () => {
    const fs = await import('node:fs/promises');

    const componentContent = await fs.readFile(
      path.join(process.cwd(), 'src/app/components/archive-item.tsx'),
      'utf8',
    );
    const constantsContent = await fs.readFile(
      path.join(process.cwd(), 'src/app/constants/ukrainian-archives.ts'),
      'utf8',
    );

    expect(componentContent).not.toMatch(/node:fs/);
    expect(componentContent).not.toMatch(/from ['"]fs['"]/);
    expect(constantsContent).not.toMatch(/node:fs/);
    expect(constantsContent).not.toMatch(/from ['"]fs['"]/);
  });

  it('preserves structural container grouping and stylesheet contracts for alignment', async () => {
    const { container } = render(<ArchiveItem archiveItem="ДАКО-37-3-216" />);
    const listItem = container.querySelector('li');
    const codeSpan = container.querySelector('span');
    const copyButton = screen.getByRole('button');
    const searchLink = screen.getByRole('link');

    expect(listItem).toBeInTheDocument();
    expect(listItem).toContainElement(codeSpan);
    expect(listItem).toContainElement(copyButton);
    expect(listItem).toContainElement(searchLink);

    const fs = await import('node:fs/promises');
    const itemCss = await fs.readFile(
      path.join(process.cwd(), 'src/app/components/archive-item.module.css'),
      'utf8',
    );
    const tableCss = await fs.readFile(
      path.join(
        process.cwd(),
        'src/app/[tableId]/[page]/table-content.module.css',
      ),
      'utf8',
    );

    expect(itemCss).toMatch(/justify-content:\s*space-between/);
    expect(itemCss).toMatch(/border:\s*1px\s+solid\s+var\(--clickable-color/);
    expect(tableCss).toMatch(/gap:\s*0\.75rem\s+1\.5rem/);
  });
});
