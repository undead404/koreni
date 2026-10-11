import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Header from './header';

const mocks = vi.hoisted(() => ({
  capture:
    vi.fn<(eventName: string, properties?: Record<string, unknown>) => void>(),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: mocks.capture }),
}));

describe('Header component', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
    Object.defineProperty(globalThis, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders desktop primary destinations on every public route', () => {
    render(<Header />);

    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Основна навігація',
    });
    const searchLink = within(primaryNavigation).getByRole('link', {
      name: 'Пошук',
    });

    expect(searchLink).toHaveAttribute('href', '/');
    expect(searchLink).toHaveAttribute('aria-current', 'page');
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Мапа' }),
    ).toHaveAttribute('href', '/map');
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Таблиці' }),
    ).toHaveAttribute('href', '/tables');
    expect(screen.getAllByRole('link', { name: 'Пошук' })).toHaveLength(1);
  });

  it.each([
    ['/map', 'Мапа'],
    ['/tables/', 'Таблиці'],
  ])('marks %s active in the primary navigation', (pathname, label) => {
    vi.mocked(usePathname).mockReturnValue(pathname);
    render(<Header />);

    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Основна навігація',
    });
    const activeLink = within(primaryNavigation).getByRole('link', {
      name: label,
    });

    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveClass('active');
  });

  it('keeps contribution and account available in the top bar', () => {
    render(<Header />);

    expect(
      screen.getByRole('link', { name: 'Поділитися даними' }),
    ).toHaveAttribute('href', '/contribute');
    expect(screen.getByRole('link', { name: 'Кабінет' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('keeps the controlled panel mounted and emits one open event', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Меню' });
    const panel = document.querySelector('#main-menu');

    expect(panel).not.toBeNull();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', 'main-menu');
    expect(panel).toHaveAttribute('aria-label', 'Додаткова навігація');
    expect(panel).toHaveAttribute('hidden');

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('hidden');
    expect(mocks.capture).toHaveBeenCalledExactlyOnceWith(
      'header_menu_opened',
      { viewport: 'desktop' },
    );
  });

  it('keeps the original mobile menu links and their order', () => {
    Object.defineProperty(globalThis, 'innerWidth', {
      configurable: true,
      value: 767,
    });
    vi.mocked(usePathname).mockReturnValue('/tables');
    render(<Header />);

    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Основна навігація',
    });
    expect(primaryNavigation.className).toContain('desktopNavigation');
    expect(document.querySelector('a.mobileSearchLink')).toHaveAttribute(
      'href',
      '/',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));

    const panel = screen.getByRole('navigation', {
      name: 'Додаткова навігація',
    });
    const links = within(panel).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toStrictEqual([
      'Мапа',
      'Таблиці',
      'Поділитися даними',
      'Волонтери',
      'Блог',
      'Про проєкт',
      'Ліцензія',
    ]);
    expect(mocks.capture).toHaveBeenCalledExactlyOnceWith(
      'header_menu_opened',
      { viewport: 'mobile' },
    );
  });

  it('closes with Escape and restores focus to the trigger', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Меню' });
    fireEvent.click(menuButton);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveFocus();
    expect(mocks.capture).toHaveBeenCalledTimes(1);
  });

  it('closes on outside pointer interaction without restoring focus', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Меню' });
    fireEvent.click(menuButton);

    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    fireEvent.pointerDown(outside);

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(outside).toHaveFocus();
    expect(mocks.capture).toHaveBeenCalledTimes(1);
    outside.remove();
  });

  it('keeps the menu open for pointer interaction inside its panel', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Меню' });
    fireEvent.click(menuButton);

    const panel = screen.getByRole('navigation', {
      name: 'Додаткова навігація',
    });
    fireEvent.pointerDown(within(panel).getByRole('link', { name: 'Таблиці' }));

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('tracks primary and menu navigation with fixed values and closes the menu', () => {
    render(<Header />);
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Основна навігація',
    });
    fireEvent.click(
      within(primaryNavigation).getByRole('link', { name: 'Мапа' }),
    );

    expect(mocks.capture).toHaveBeenCalledExactlyOnceWith(
      'header_navigation_clicked',
      { destination: 'map', placement: 'primary', viewport: 'desktop' },
    );

    mocks.capture.mockClear();
    const menuButton = screen.getByRole('button', { name: 'Меню' });
    fireEvent.click(menuButton);
    mocks.capture.mockClear();

    const panel = screen.getByRole('navigation', {
      name: 'Додаткова навігація',
    });
    const tablesLink = within(panel).getByRole('link', { name: 'Таблиці' });
    fireEvent.click(tablesLink);

    expect(tablesLink).toHaveAttribute('href', '/tables');
    expect(mocks.capture).toHaveBeenCalledExactlyOnceWith(
      'header_navigation_clicked',
      { destination: 'tables', placement: 'menu', viewport: 'desktop' },
    );
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('hidden');
  });

  it('marks nested Blog routes active and normalizes trailing slashes', () => {
    vi.mocked(usePathname).mockReturnValue('/blog/article-name/');
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));

    const panel = screen.getByRole('navigation', {
      name: 'Додаткова навігація',
    });
    const blogLink = within(panel).getByRole('link', { name: 'Блог' });
    expect(blogLink).toHaveClass('activeMenuLink');
    expect(blogLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not render the public header in the account area', () => {
    vi.mocked(usePathname).mockReturnValue('/account/transcribe/');
    const { container } = render(<Header />);

    expect(container.querySelector('header')).not.toBeInTheDocument();
  });
});
