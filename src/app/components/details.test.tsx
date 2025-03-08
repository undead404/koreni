import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Details } from './details';

vi.mock('../hocs/with-error-boundary');

const Test = vi.fn(() => <div>Test Component</div>);

const defaultProps = {
  children: Test(),
  summary: 'test',
};

describe('Details component', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('should render the details and summary elements', () => {
    const { container } = render(<Details {...defaultProps} />);
    const details = container.querySelector('details');
    const summary = container.querySelector('summary');
    expect(details).toBeInTheDocument();
    expect(summary).toBeInTheDocument();
  });

  it('should render the test component when the details element is clicked', async () => {
    const { container, getByText } = render(<Details {...defaultProps} />);
    const details = container.querySelector('details');
    fireEvent.click(details!);
    await waitFor(() => getByText('Test Component'));
    expect(getByText('Test Component')).toBeInTheDocument();
  });
});
