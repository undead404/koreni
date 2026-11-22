import { cleanup, render } from '@testing-library/react';
import type { ImageProps } from 'next/image';
import { usePathname } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RootLayout, { metadata } from './layout';

import githubIcon from './assets/github.svg';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: vi.fn(),
}));

vi.mock('./components/header', () => ({
  default: () => <div>Mocked Header</div>,
}));
vi.mock('./environment');
vi.mock('./providers/no-russians');
vi.mock('next/image', () => ({
  default: ({ src, alt, className, height, title, width }: ImageProps) => (
    <img
      src={src as string}
      alt={alt}
      className={className}
      height={height}
      title={title}
      width={width}
    />
  ),
}));
vi.mock('next/font/google', () => ({
  Geist: () => ({
    variable: 'geistSans-variable',
  }),
  Geist_Mono: () => ({
    variable: 'geistMono-variable',
  }),
}));

describe('RootLayout', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders metadata correctly', () => {
    expect(metadata).toMatchObject({
      title: {
        default: 'Корені',
        template: '%s | Корені',
      },

      description: 'Пошук у народних генеалогічних індексах',
    });
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>,
    );
    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('renders header correctly', () => {
    const { getByText } = render(
      <RootLayout>
        <div />
      </RootLayout>,
    );
    expect(getByText('Mocked Header')).toBeInTheDocument();
  });

  it.each(['/not-welcome', '/not-welcome/'])(
    'removes site controls when navigating to %s',
    (pathname) => {
      const { baseElement, getByText, queryByText, rerender } = render(
        <RootLayout>
          <h1>You are not welcome here</h1>
        </RootLayout>,
      );
      expect(getByText('Mocked Header')).toBeInTheDocument();
      expect(baseElement.querySelector('footer')).toBeInTheDocument();

      vi.mocked(usePathname).mockReturnValue(pathname);
      rerender(
        <RootLayout>
          <h1>You are not welcome here</h1>
        </RootLayout>,
      );

      expect(getByText('You are not welcome here')).toBeInTheDocument();
      expect(queryByText('Mocked Header')).not.toBeInTheDocument();
      expect(baseElement.querySelector('footer')).not.toBeInTheDocument();
      expect(
        baseElement.querySelector('a, button, input, dialog, [tabindex]'),
      ).not.toBeInTheDocument();
    },
  );

  it('renders GitHub link correctly', () => {
    const { getByAltText } = render(
      <RootLayout>
        <div />
      </RootLayout>,
    );
    const githubLink = getByAltText('GitHub logo');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink.getAttribute('src')).toBe(githubIcon);
    expect(githubLink.getAttribute('alt')).toBe('GitHub logo');
    expect(githubLink.getAttribute('class')).toContain('filter-inverted');
  });
});
