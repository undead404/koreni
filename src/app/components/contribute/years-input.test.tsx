import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import YearsInput from './years-input';

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({
    capture: vi.fn(),
  }),
}));

describe('YearsInput', () => {
  it('does not crash when value is null', () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const ref = vi.fn();

    render(
      <YearsInput
        // @ts-expect-error Testing invalid input that causes the bug
        value={null}
        onChange={onChange}
        onBlur={onBlur}
        name="yearsRange"
        ref={ref}
      />,
    );

    expect(
      screen.getByLabelText('Рік або діапазон років через дефіс'),
    ).toBeInTheDocument();
  });
});
