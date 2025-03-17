import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import scrollOnce from '../helpers/scroll-once';

import IndexTableCell from './index-table-cell';

vi.mock('../helpers/scroll-once', () => ({
  __esModule: true,
  default: vi.fn(),
}));

describe('IndexTableCell component', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('should render the table cell element', () => {
    const { container } = render(
      <IndexTableCell matchedTokens={[]} value="Test value" />,
    );
    const tableCell = container.querySelector('td');
    expect(tableCell).toBeInTheDocument();
  });

  it('should render the value without highlights if no matched tokens', () => {
    const { container } = render(
      <IndexTableCell matchedTokens={[]} value="Test value" />,
    );
    const tableCell = container.querySelector('td');
    expect(tableCell?.innerHTML).toBe('Test value');
  });

  it('should highlight matched tokens in the value', () => {
    const { container } = render(
      <IndexTableCell matchedTokens={['Test']} value="Test value" />,
    );
    const tableCell = container.querySelector('td');
    expect(tableCell?.innerHTML).toContain(
      '<mark class="mark">Test</mark> value',
    );
  });

  it('should handle multiple matched tokens', () => {
    const { container } = render(
      <IndexTableCell matchedTokens={['Тест', 'value']} value="Тест value" />,
    );
    const tableCell = container.querySelector('td');
    expect(tableCell?.innerHTML).toContain(
      '<mark class="mark">Тест</mark> <mark class="mark">value</mark>',
    );
  });

  it('should scroll to mark when isInTarget', () => {
    const { container } = render(
      <IndexTableCell isInTarget matchedTokens={['Test']} value="Test value" />,
    );
    const mark = container.querySelector('mark');
    expect(scrollOnce).toHaveBeenCalledWith(mark);
  });
});
