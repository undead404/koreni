import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import SearchSkeleton from './search-skeleton';

afterEach(cleanup);

describe('SearchSkeleton', () => {
  it('reserves the search controls and initial count without focusable inputs', () => {
    const { container } = render(<SearchSkeleton recordsNumber={1234} />);

    expect(screen.getByLabelText('Завантаження пошуку')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(
      screen.getByText('Всього рядків у таблицях: 1234'),
    ).toBeInTheDocument();
    const inputs = container.querySelectorAll('input');
    expect(inputs).toHaveLength(3);
    for (const input of inputs) expect(input).toBeDisabled();
    expect(container.querySelector('[inert]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
