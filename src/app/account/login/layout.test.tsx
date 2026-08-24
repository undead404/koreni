import { describe, expect, it } from 'vitest';

import LoginLayout, { metadata } from './layout';

describe('LoginLayout', () => {
  it('defines the login page title', () => {
    expect(metadata.title).toBe('Вхід');
  });

  it('renders children', () => {
    expect(LoginLayout({ children: 'Login content' })).toBe('Login content');
  });
});
