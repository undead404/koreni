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

  it('places Search, Map, and Tables in the menu on desktop', () => {
    render(<Header />);

    expect(
      screen.queryByRole('navigation', { name: 'Основна навігація' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Пошук' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    const panel = screen.getByRole('navigation', {
      name: 'Додаткова навігація',
    });
    const dataGroup = within(panel).getByText('Дані').parentElement;

    if (!dataGroup) throw new Error('Expected the Data menu group');
    expect(
      within(dataGroup)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toStrictEqual(['Пошук', 'Мапа', 'Таблиці']);
    expect(screen.getAllByRole('link', { name: 'Пошук' })).toHaveLength(1);
  });

  it('keeps Search, Map, and Tables first in the mobile menu', () => {
    Object.defineProperty(globalThis, 'innerWidth', {
      configurable: true,
      value: 767,
    });
    vi.mocked(usePathname).mockReturnValue('/tables');
    render(<Header />);

    expect(
      screen.queryByRole('link', { name: 'Пошук' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));

    const panel = screen.getByRole('navigation', {
      name: 'Додаткова навігація',
    });
    const links = within(panel).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toStrictEqual([
      'Пошук',
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

  it.each([
    ['/', 'Пошук'],
    ['/map', 'Мапа'],
    ['/tables/', 'Таблиці'],
  ])('marks %s active in the menu', (pathname, label) => {
    vi.mocked(usePathname).mockReturnValue(pathname);
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));

    const panel = screen.getByRole('navigation', {
      name: 'Додаткова навігація',
    });
    const activeLink = within(panel).getByRole('link', { name: label });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveClass('activeMenuLink');
  });

  it('keeps contribution and account in the top bar and marks contribution active', () => {
    vi.mocked(usePathname).mockReturnValue('/contribute/');
    render(<Header />);

    const contributeLink = screen.getByRole('link', {
      name: 'Поділитися даними',
    });
    expect(contributeLink).toHaveAttribute('href', '/contribute');
    expect(contributeLink).toHaveAttribute('aria-current', 'page');
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
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('hidden');
    expect(mocks.capture).toHaveBeenCalledExactlyOnceWith(
      'header_menu_opened',
      { viewport: 'desktop' },
    );

    fireEvent.click(menuButton);
    expect(mocks.capture).toHaveBeenCalledTimes(2);
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

  it('tracks fixed menu and top-bar destinations and closes after menu navigation', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    const panel = screen.getByRole('navigation', {
      name: 'Додаткова навігація',
    });
    const mapLink = within(panel).getByRole('link', { name: 'Мапа' });
    fireEvent.click(mapLink);

    expect(mocks.capture).toHaveBeenLastCalledWith(
      'header_navigation_clicked',
      { destination: 'map', placement: 'menu', viewport: 'desktop' },
    );
    expect(screen.getByRole('button', { name: 'Меню' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(panel).toHaveAttribute('hidden');

    fireEvent.click(screen.getByRole('link', { name: 'Кабінет' }));
    expect(mocks.capture).toHaveBeenLastCalledWith(
      'header_navigation_clicked',
      { destination: 'account', placement: 'top_bar', viewport: 'desktop' },
    );

    fireEvent.click(screen.getByRole('link', { name: 'Поділитися даними' }));
    expect(mocks.capture).toHaveBeenLastCalledWith(
      'header_navigation_clicked',
      { destination: 'contribute', placement: 'top_bar', viewport: 'desktop' },
    );
  });

  it.each([
    ['Пошук', 'search'],
    ['Мапа', 'map'],
    ['Таблиці', 'tables'],
  ])('tracks %s as a menu destination', (label, destination) => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    mocks.capture.mockClear();

    const panel = screen.getByRole('navigation', {
      name: 'Додаткова навігація',
    });
    fireEvent.click(within(panel).getByRole('link', { name: label }));

    expect(mocks.capture).toHaveBeenCalledExactlyOnceWith(
      'header_navigation_clicked',
      { destination, placement: 'menu', viewport: 'desktop' },
    );
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
