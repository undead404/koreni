import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TranscriptionTable from './transcription-table';

describe('TranscriptionTable', () => {
  const mockColumns = [
    {
      id: 'name',
      title: 'Name',
      expectedType: 'string' as const,
      hint: '',
    },
    {
      id: 'note',
      title: 'Note',
      expectedType: 'string' as const,
      hint: '',
    },
  ];
  const mockRows = [{ id: '1', name: '', note: '' }];

  beforeEach(() => {
    // jsdom does not implement HTMLDialogElement.showModal / close
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly with given props', () => {
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
  });

  it('allows adding rows', () => {
    const onAddRow = vi.fn();
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={onAddRow}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    const addButton = screen.getByText('Додати рядок');
    fireEvent.click(addButton);
    expect(onAddRow).toHaveBeenCalled();
  });

  it('does not call onDeleteRow immediately when delete button is clicked', () => {
    const onDeleteRow = vi.fn();
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={vi.fn()}
        onDeleteRow={onDeleteRow}
        onUpdateRow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle('Видалити'));
    expect(onDeleteRow).not.toHaveBeenCalled();
  });

  it('opens a confirmation dialog when delete button is clicked', () => {
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle('Видалити'));
    expect(screen.getByText('Видалити рядок?')).toBeInTheDocument();
    expect(screen.getByText('Цю дію неможливо скасувати.')).toBeInTheDocument();
  });

  it('calls onDeleteRow with the correct id after confirming deletion', () => {
    const onDeleteRow = vi.fn();
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={vi.fn()}
        onDeleteRow={onDeleteRow}
        onUpdateRow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle('Видалити'));
    // Query by text content since jsdom does not set the `open` attribute on
    // <dialog> when showModal() is mocked, making getByRole unreliable.
    const confirmButtons = screen.getAllByText('Видалити');
    const confirmButton = confirmButtons.find(
      (element) =>
        element.tagName === 'BUTTON' && element.closest('dialog') !== null,
    );
    fireEvent.click(confirmButton as HTMLElement);
    expect(onDeleteRow).toHaveBeenCalledWith('1');
  });

  it('does not call onDeleteRow when cancelling the confirmation dialog', () => {
    const onDeleteRow = vi.fn();
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={vi.fn()}
        onDeleteRow={onDeleteRow}
        onUpdateRow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle('Видалити'));
    fireEvent.click(screen.getByText('Скасувати'));
    expect(onDeleteRow).not.toHaveBeenCalled();
  });

  it('closes the confirmation dialog after cancelling', () => {
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle('Видалити'));
    expect(screen.getByText('Видалити рядок?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Скасувати'));
    expect(screen.queryByText('Видалити рядок?')).not.toBeInTheDocument();
  });

  it('allows inserting a row above', () => {
    const onAddRow = vi.fn();
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={onAddRow}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    const insertAboveButton = screen.getByTitle('Додати рядок вище');
    fireEvent.click(insertAboveButton);
    expect(onAddRow).toHaveBeenCalledWith(0);
  });

  it('updates row state when typing', () => {
    const onUpdateRow = vi.fn();
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onUpdateRow={onUpdateRow}
      />,
    );

    const nameInput = screen.getByPlaceholderText('Name');
    fireEvent.change(nameInput, { target: { value: 'Shevchenko' } });
    expect(onUpdateRow).toHaveBeenCalledWith('1', 'name', 'Shevchenko');
  });

  it('substitutes historical Russian characters when projectLocale is ru', () => {
    const onUpdateRow = vi.fn();
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        projectLocale="ru"
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onUpdateRow={onUpdateRow}
      />,
    );

    const nameInput = screen.getByPlaceholderText('Name');

    fireEvent.change(nameInput, { target: { value: 'еее' } });
    expect(onUpdateRow).toHaveBeenCalledWith('1', 'name', 'ѣ');

    fireEvent.change(nameInput, { target: { value: 'иии' } });
    expect(onUpdateRow).toHaveBeenCalledWith('1', 'name', 'ы');
  });

  it('disables inputs when hasPageName is false', () => {
    render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={false}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    const addButton = screen.getByText('Додати рядок');
    expect(addButton).toBeDisabled();

    const nameInput = screen.getByPlaceholderText('Name');
    expect(nameInput).toBeDisabled();
  });

  it('focuses the first cell of a newly appended row after "Додати рядок"', () => {
    const newRowId = 'new-row-id';
    const newRow = { id: newRowId, name: '', note: '' };
    const onAddRow = vi.fn().mockReturnValue(newRowId);

    const { rerender } = render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={onAddRow}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByText('Додати рядок'));
    });

    rerender(
      <TranscriptionTable
        columns={mockColumns}
        rows={[...mockRows, newRow]}
        hasPageName={true}
        onAddRow={onAddRow}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    const nameInputs = screen.getAllByPlaceholderText('Name');
    const newRowInput = nameInputs.at(-1);
    expect(document.activeElement).toBe(newRowInput);
  });

  it('focuses the first cell of an inserted row after "Додати рядок вище"', () => {
    const newRowId = 'inserted-row-id';
    const insertedRow = { id: newRowId, name: '', note: '' };
    const onAddRow = vi.fn().mockReturnValue(newRowId);

    const { rerender } = render(
      <TranscriptionTable
        columns={mockColumns}
        rows={mockRows}
        hasPageName={true}
        onAddRow={onAddRow}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByTitle('Додати рядок вище'));
    });

    rerender(
      <TranscriptionTable
        columns={mockColumns}
        rows={[insertedRow, ...mockRows]}
        hasPageName={true}
        onAddRow={onAddRow}
        onDeleteRow={vi.fn()}
        onUpdateRow={vi.fn()}
      />,
    );

    const nameInputs = screen.getAllByPlaceholderText('Name');
    expect(document.activeElement).toBe(nameInputs[0]);
  });
});
