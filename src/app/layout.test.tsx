import { cleanup, render } from '@testing-library/react';
import type { ImageProps } from 'next/image';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RootLayout, { metadata } from './layout';

import githubIcon from './assets/github.svg';

vi.mock('./components/header', () => ({
  default: () => <div>Mocked Header</div>,
}));
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
  afterEach(() => {
    cleanup();
  });

  it('renders metadata correctly', () => {
    expect(metadata).toEqual({
      title: 'Корені',
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
