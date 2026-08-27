import { cleanup, render } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ProjectCreatePage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/app/environment', () => ({
  default: { NEXT_PUBLIC_ENABLE_TRANSCRIBE: false },
}));

describe('ProjectCreatePage', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls notFound when NEXT_PUBLIC_ENABLE_TRANSCRIBE is false', () => {
    expect(() => render(<ProjectCreatePage />)).toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
