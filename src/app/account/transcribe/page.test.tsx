import { cleanup, render } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import TranscribeDashboardPage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/app/environment', () => ({
  default: {
    NEXT_PUBLIC_ENABLE_TRANSCRIBE: false,
  },
}));

vi.mock('./components/projects-list', () => ({
  default: () => <div>Projects List</div>,
}));

describe('TranscribeDashboardPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls notFound when NEXT_PUBLIC_ENABLE_TRANSCRIBE is false', () => {
    expect(() => render(<TranscribeDashboardPage />)).toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
