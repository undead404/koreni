import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import type { MouseEventHandler, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HomeDiscover from './home-discover';

const mocks = vi.hoisted(() => ({
  capture:
    vi.fn<(eventName: string, properties?: Record<string, unknown>) => void>(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    className,
    href,
    onClick,
  }: {
    children: ReactNode;
    className?: string;
    href: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a className={className} href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: mocks.capture }),
}));

describe('HomeDiscover component', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the exact heading and fixed destinations', () => {
    render(<HomeDiscover />);

    expect(
      screen.getByRole('heading', { name: 'Що ще тут є?', level: 2 }),
    ).toBeInTheDocument();
    const section = screen.getByRole('region', { name: 'Що ще тут є?' });
    const links = within(section).getAllByRole('link');
    expect(
      links.map((link) => [link.textContent, link.getAttribute('href')]),
    ).toStrictEqual([
      ['Мапа України з позначками наявних даних', '/map'],
      ['Список наявних таблиць', '/tables'],
      ['Блог коренів – про рушій та індексування', '/blog'],
      ['Перелік тих, хто приніс дорогоцінні таблиці', '/volunteers'],
    ]);
  });

  it.each([
    ['Мапа України з позначками наявних даних', 'map', 1024, 'desktop'],
    ['Список наявних таблиць', 'tables', 1024, 'desktop'],
    ['Блог коренів – про рушій та індексування', 'blog', 767, 'mobile'],
    [
      'Перелік тих, хто приніс дорогоцінні таблиці',
      'volunteers',
      768,
      'desktop',
    ],
  ] as const)(
    'tracks %s with only its fixed destination and viewport',
    (label, destination, innerWidth, viewport) => {
      Object.defineProperty(globalThis, 'innerWidth', {
        configurable: true,
        value: innerWidth,
      });
      render(<HomeDiscover />);

      fireEvent.click(screen.getByRole('link', { name: label }));

      expect(mocks.capture).toHaveBeenCalledExactlyOnceWith(
        'home_discover_clicked',
        { destination, viewport },
      );
    },
  );

  it('does not cancel link activation when analytics capture throws', () => {
    mocks.capture.mockImplementationOnce(() => {
      throw new Error('PostHog unavailable');
    });
    render(<HomeDiscover />);
    const link = screen.getByRole('link', {
      name: 'Мапа України з позначками наявних даних',
    });
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    expect(() => link.dispatchEvent(clickEvent)).not.toThrow();
    expect(clickEvent.defaultPrevented).toBe(false);
    expect(link).toHaveAttribute('href', '/map');
  });
});
