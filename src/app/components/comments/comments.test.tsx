import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import environment from '../../environment';

import Comments from './comments';

vi.mock('../../environment', () => ({
  default: {
    NEXT_PUBLIC_REMARK42_HOST: 'https://comments.example.com',
  },
}));

vi.mock('./remark42', () => ({
  default: () => <div data-testid="remark42" />,
}));

describe('Comments', () => {
  it('renders the comments section when Remark42 host is configured', () => {
    render(<Comments />);

    expect(screen.getByRole('region', { name: /обговорення та запитання/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Обговорення та запитання');
    expect(screen.getByTestId('remark42')).toBeInTheDocument();
  });

  it('renders nothing when Remark42 host is not configured', () => {
    vi.mocked(environment).NEXT_PUBLIC_REMARK42_HOST = '';

    const { container } = render(<Comments />);

    expect(container).toBeEmptyDOMElement();
  });
});
