import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  beforeEach(() => {
    vi.mocked(environment).NEXT_PUBLIC_REMARK42_HOST =
      'https://comments.example.com';
  });

  afterEach(cleanup);

  it('shows the disclosure with configured indexation comments', () => {
    render(<Comments context="indexation" />);

    expect(
      screen.getByRole('region', { name: /обговорення та запитання/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Обговорення та запитання',
    );
    expect(screen.getByTestId('remark42')).toBeInTheDocument();
    expect(
      screen.getByText(/автор може їх не побачити й не відповісти/i),
    ).toBeInTheDocument();
  });

  it('omits the disclosure in the default context', () => {
    render(<Comments />);

    expect(screen.getByTestId('remark42')).toBeInTheDocument();
    expect(
      screen.queryByText(/автор може їх не побачити/i),
    ).not.toBeInTheDocument();
  });

  it('renders nothing, including the disclosure, when Remark42 is not configured', () => {
    vi.mocked(environment).NEXT_PUBLIC_REMARK42_HOST = '';

    const { container } = render(<Comments context="indexation" />);

    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByText(/автор може їх не побачити/i),
    ).not.toBeInTheDocument();
  });
});
