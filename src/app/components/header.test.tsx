import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Header from './header';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

describe('Header component', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the header element', () => {
    const { container } = render(<Header />);
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('omits the search link on the home page', () => {
    render(<Header />);
    expect(
      screen.queryByRole('link', { name: 'Пошук' }),
    ).not.toBeInTheDocument();
  });

  it('renders the search and account links on non-home pages', () => {
    vi.mocked(usePathname).mockReturnValue('/tables');
    render(<Header />);

    expect(screen.getByRole('link', { name: 'Пошук' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: 'Кабінет' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('keeps contribution directly available', () => {
    render(<Header />);
    expect(
      screen.getByRole('link', { name: 'Поділитися даними' }),
    ).toHaveAttribute('href', '/contribute');
  });

  it('shows secondary links after opening the menu', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Меню' });

    expect(
      screen.queryByRole('link', { name: 'Таблиці' }),
    ).not.toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton.querySelector('span')).not.toHaveClass(
      'menuIndicatorOpen',
    );
    expect(menuButton.querySelector('span')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    fireEvent.click(menuButton);

    expect(screen.getByRole('link', { name: 'Таблиці' })).toHaveAttribute(
      'href',
      '/tables',
    );
    expect(screen.getByRole('link', { name: 'Мапа' })).toHaveAttribute(
      'href',
      '/map',
    );
    expect(screen.getByRole('link', { name: 'Волонтери' })).toHaveAttribute(
      'href',
      '/volunteers',
    );
    expect(screen.getByRole('link', { name: 'Про проєкт' })).toHaveAttribute(
      'href',
      '/about',
    );
    expect(screen.getByRole('link', { name: 'Блог' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(screen.getByRole('link', { name: 'Ліцензія' })).toHaveAttribute(
      'href',
      '/license',
    );
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(menuButton.querySelector('span')).toHaveClass('menuIndicatorOpen');
    expect(
      screen.getAllByRole('link', { name: 'Поділитися даними' }),
    ).toHaveLength(2);
  });

  it('closes the menu with Escape', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Меню' });

    fireEvent.click(menuButton);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(
      screen.queryByRole('link', { name: 'Таблиці' }),
    ).not.toBeInTheDocument();
    expect(menuButton).toHaveFocus();
  });

  it('closes the menu when the page outside it is interacted with', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Меню' });

    fireEvent.click(menuButton);
    fireEvent.pointerDown(document.body);

    expect(
      screen.queryByRole('link', { name: 'Таблиці' }),
    ).not.toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the menu open when its panel is interacted with', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Меню' });

    fireEvent.click(menuButton);
    fireEvent.pointerDown(screen.getByRole('link', { name: 'Таблиці' }));

    expect(screen.getByRole('link', { name: 'Таблиці' })).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks the active license link without promoting it to a group heading', () => {
    vi.mocked(usePathname).mockReturnValue('/license');
    render(<Header />);

    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));

    const licenseLink = screen.getByRole('link', { name: 'Ліцензія' });
    expect(licenseLink).toHaveClass('activeMenuLink');
    expect(licenseLink).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Що таке Корені?')).not.toHaveClass(
      'activeMenuLink',
    );
  });

  it('marks the blog link active on blog articles', () => {
    vi.mocked(usePathname).mockReturnValue('/blog/how-koreni-search-works');
    render(<Header />);

    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));

    const blogLink = screen.getByRole('link', { name: 'Блог' });
    expect(blogLink).toHaveClass('activeMenuLink');
    expect(blogLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not render the public header in the account area', () => {
    vi.mocked(usePathname).mockReturnValue('/account/transcribe/');
    const { container } = render(<Header />);

    expect(container.querySelector('header')).not.toBeInTheDocument();
  });
});
