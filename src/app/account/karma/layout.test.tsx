import { describe, expect, it } from 'vitest';

import KarmaLayout, { metadata } from './layout';

describe('KarmaLayout', () => {
  it('defines the karma page title', () => {
    expect(metadata.title).toBe('Карма');
  });

  it('renders children', () => {
    expect(KarmaLayout({ children: 'Karma content' })).toBe('Karma content');
  });
});
