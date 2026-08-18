import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import IndexTableRow from './index-table-row';

vi.mock('../helpers/scroll-once', () => ({
  __esModule: true,
  default: vi.fn(),
}));

const mockData = { name: 'John', age: 30 };

describe('IndexTableRow component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render the table row element', () => {
    const { container } = render(
      <IndexTableRow
        id="row-test-1"
        data={mockData}
        isTarget={false}
        matchedTokens={[]}
      />,
    );
    const row = container.querySelector('tr');
    expect(row).toBeInTheDocument();
    expect(row?.id).toBe('row-test-1');
  });

  it('should render cells for all data properties', () => {
    const { container } = render(
      <IndexTableRow
        id="row-test-1"
        data={mockData}
        isTarget={false}
        matchedTokens={[]}
      />,
    );
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(Object.keys(mockData).length);
  });

  it('should call onScrollMissed when isTarget is true but no token matches any cell value', () => {
    const onScrollMissed = vi.fn();
    render(
      <IndexTableRow
        id="row-test-1"
        data={mockData}
        isTarget
        matchedTokens={['NoMatch']}
        onScrollMissed={onScrollMissed}
      />,
    );
    expect(onScrollMissed).toHaveBeenCalledOnce();
  });

  it('should NOT call onScrollMissed when isTarget is false', () => {
    const onScrollMissed = vi.fn();
    render(
      <IndexTableRow
        id="row-test-1"
        data={mockData}
        isTarget={false}
        matchedTokens={['NoMatch']}
        onScrollMissed={onScrollMissed}
      />,
    );
    expect(onScrollMissed).not.toHaveBeenCalled();
  });

  it('should NOT call onScrollMissed when isTarget is true and a token matches a cell value', () => {
    const onScrollMissed = vi.fn();
    render(
      <IndexTableRow
        id="row-test-1"
        data={mockData}
        isTarget
        matchedTokens={['John']}
        onScrollMissed={onScrollMissed}
      />,
    );
    expect(onScrollMissed).not.toHaveBeenCalled();
  });
});
