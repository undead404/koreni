import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import SourcesFilter from './sources-filter';

function renderFilter({
  archives = ['ДАКО', 'ДАЖО'],
  hasOther = true,
  emptyState = <p>Нічого не знайдено</p>,
}: {
  archives?: string[];
  hasOther?: boolean;
  emptyState?: ReactNode;
} = {}) {
  return render(
    <SourcesFilter
      archives={archives}
      hasOther={hasOther}
      totalCount={3}
      emptyState={emptyState}
    >
      <table>
        <tbody>
          <tr
            data-archive="ДАКО"
            data-fond="384"
            data-opys="10"
            data-sprava="1"
          >
            <td>row-a</td>
          </tr>
          <tr data-archive="ДАЖО" data-fond="1" data-opys="2" data-sprava="3">
            <td>row-b</td>
          </tr>
          <tr data-archive="" data-fond="" data-opys="" data-sprava="">
            <td>row-c</td>
          </tr>
        </tbody>
      </table>
    </SourcesFilter>,
  );
}

const getRow = (label: string) =>
  screen.getByText(label).closest('tr') as HTMLTableRowElement;

const getTable = () => screen.queryByRole('table');

const waitForDisplays = (
  rowA: string,
  rowB: string,
  rowC: string,
): Promise<readonly [string, string, string]> =>
  waitFor(() => {
    const triple = [
      getRow('row-a').style.display,
      getRow('row-b').style.display,
      getRow('row-c').style.display,
    ] as const;
    if (triple[0] !== rowA || triple[1] !== rowB || triple[2] !== rowC) {
      throw new Error(
        `expected [${rowA}, ${rowB}, ${rowC}] got [${triple.join(', ')}]`,
      );
    }
    return triple;
  });

const waitForTableToDisappear = (): Promise<void> =>
  waitFor(() => {
    if (getTable()) {
      throw new Error('expected table to be hidden');
    }
  });

const waitForTableToAppear = (): Promise<void> =>
  waitFor(() => {
    const table = getTable();
    if (!table) {
      throw new Error('expected table to be visible');
    }
  });

describe('SourcesFilter', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows all rows initially', async () => {
    renderFilter();
    expect(await waitForDisplays('', '', '')).toStrictEqual(['', '', '']);
  });

  it('filters by archive', async () => {
    renderFilter();
    fireEvent.change(screen.getByLabelText('Архів'), {
      target: { value: 'ДАКО' },
    });
    expect(await waitForDisplays('', 'none', 'none')).toStrictEqual([
      '',
      'none',
      'none',
    ]);
  });

  it('filters by fond prefix', async () => {
    renderFilter();
    fireEvent.change(screen.getByLabelText('Фонд'), {
      target: { value: '38' },
    });
    expect(await waitForDisplays('', 'none', 'none')).toStrictEqual([
      '',
      'none',
      'none',
    ]);
  });

  it('shows only unparsed rows when "Інші джерела" is selected', async () => {
    renderFilter();
    fireEvent.change(screen.getByLabelText('Архів'), {
      target: { value: '__other__' },
    });
    expect(await waitForDisplays('none', 'none', '')).toStrictEqual([
      'none',
      'none',
      '',
    ]);
  });

  it('disables fond/opys/sprava when "Інші джерела" is selected', () => {
    renderFilter();
    fireEvent.change(screen.getByLabelText('Архів'), {
      target: { value: '__other__' },
    });
    expect(screen.getByLabelText('Фонд')).toBeDisabled();
    expect(screen.getByLabelText('Опис')).toBeDisabled();
    expect(screen.getByLabelText('Справа')).toBeDisabled();
  });

  it('clears subfield values when switching to "Інші джерела"', () => {
    renderFilter();
    const fond = screen.getByLabelText<HTMLInputElement>('Фонд');
    fireEvent.change(fond, { target: { value: '384' } });
    expect(fond.value).toBe('384');
    fireEvent.change(screen.getByLabelText('Архів'), {
      target: { value: '__other__' },
    });
    expect(fond.value).toBe('');
  });

  it('reset clears every filter and restores all rows', async () => {
    renderFilter();
    fireEvent.change(screen.getByLabelText('Архів'), {
      target: { value: 'ДАКО' },
    });
    fireEvent.change(screen.getByLabelText('Фонд'), {
      target: { value: '999' },
    });
    await waitForTableToDisappear();
    fireEvent.click(screen.getByRole('button', { name: 'Скинути' }));
    await waitForTableToAppear();
    expect(await waitForDisplays('', '', '')).toStrictEqual(['', '', '']);
  });

  it('shows empty state when no rows match the filters', async () => {
    renderFilter();
    fireEvent.change(screen.getByLabelText('Фонд'), {
      target: { value: '999' },
    });

    await waitForTableToDisappear();
    expect(screen.getByText('Нічого не знайдено')).toBeDefined();
  });

  it('hides the table header when no rows match the filters', async () => {
    renderFilter();
    fireEvent.change(screen.getByLabelText('Фонд'), {
      target: { value: '999' },
    });

    await waitForTableToDisappear();
    expect(screen.queryByRole('columnheader', { name: 'Архів' })).toBeNull();
  });

  it('hides "Інші джерела" option when hasOther is false', () => {
    renderFilter({ hasOther: false });
    expect(screen.queryByText('Інші джерела')).toBeNull();
  });
});
