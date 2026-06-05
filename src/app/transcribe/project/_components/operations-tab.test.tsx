import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import OperationsTab from './operations-tab';

describe('OperationsTab', () => {
  it('renders placeholders', () => {
    render(<OperationsTab />);
    expect(screen.getByText('Data Export Options')).toBeInTheDocument();
    expect(screen.getByText('Export to CSV (Disabled)')).toBeInTheDocument();
  });
});
