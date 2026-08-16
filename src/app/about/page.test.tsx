import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AboutPage, { metadata } from './page';

vi.mock('../components/comments/comments', () => ({
  default: () => <div data-testid="comments" />,
}));

describe('AboutPage', () => {
  afterEach(() => {
    cleanup();
  });
  it('should have correct metadata', () => {
    expect(metadata.title).toBe('Про проєкт');
    expect(metadata.description).toBe(
      'Про проєкт "Корені", його автора та мотивацію для його появи.',
    );
    expect(metadata.alternates?.canonical).toBe('/about/');
    expect(metadata.openGraph?.title).toBe('Про проєкт');
    expect(metadata.twitter?.title).toBe('Про проєкт');
  });

  it('should render correctly', () => {
    render(<AboutPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Про проєкт "Корені"/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Хто автор Коренів\?/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Подяки/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Чому з'явилися Корені\?/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Як можна допомогти\?/i }),
    ).toBeInTheDocument();
  });

  it('should render the comments component', () => {
    render(<AboutPage />);
    expect(screen.getByTestId('comments')).toBeInTheDocument();
  });

  it('should have external links with correct security attributes', () => {
    render(<AboutPage />);

    const externalLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('target') === '_blank');

    expect(externalLinks.length).toBeGreaterThan(0);

    for (const link of externalLinks) {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('should contain functional internal links', () => {
    render(<AboutPage />);

    expect(screen.getByRole('link', { name: /Ліцензія/i })).toHaveAttribute(
      'href',
      '/license',
    );
    expect(
      screen.getByRole('link', { name: /Усім волонтерам Коренів/i }),
    ).toHaveAttribute('href', '/volunteers');
    expect(
      screen.getByRole('link', { name: /Додати власну таблицю/i }),
    ).toHaveAttribute('href', '/contribute');
  });

  it('should contain contact email links', () => {
    render(<AboutPage />);
    const emailLinks = screen.getAllByRole('link', {
      name: /admin@koreni\.org\.ua/i,
    });
    expect(emailLinks.length).toBeGreaterThan(0);
    for (const link of emailLinks) {
      expect(link).toHaveAttribute('href', 'mailto:admin@koreni.org.ua');
    }
  });
});

describe('AboutPage - Меценати section', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the Меценати h3 heading', () => {
    render(<AboutPage />);
    expect(
      screen.getByRole('heading', { level: 3, name: /Меценати/i }),
    ).toBeInTheDocument();
  });

  it('renders Serhii Fazulianov name linked to Facebook profile', () => {
    render(<AboutPage />);
    const link = screen.getByRole('link', { name: /Сергій Фазульянов/i });
    expect(link).toHaveAttribute(
      'href',
      'https://www.facebook.com/S.Fazulyanov',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the secondary Instagram link', () => {
    render(<AboutPage />);
    const link = screen.getByRole('link', { name: /Instagram/i });
    expect(link).toHaveAttribute(
      'href',
      'https://www.instagram.com/fazu.genealogy/',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the first benefactor descriptor text', () => {
    render(<AboutPage />);
    expect(screen.getByText(/перший меценат Коренів/i)).toBeInTheDocument();
  });

  it('renders the Учасники та спільноти h3 heading', () => {
    render(<AboutPage />);
    expect(
      screen.getByRole('heading', { level: 3, name: /Учасники та спільноти/i }),
    ).toBeInTheDocument();
  });
});

describe('AboutPage - Як можна допомогти section', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the financial support paragraph', () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/підтримати проєкт фінансово/i),
    ).toBeInTheDocument();
  });
});

describe('AboutPage - existing Подяки entries regression', () => {
  afterEach(() => {
    cleanup();
  });

  it('still renders Alina Listunova entry', () => {
    render(<AboutPage />);
    expect(screen.getByText(/Аліні Лістуновій/i)).toBeInTheDocument();
  });

  it('still renders UAGenealogy Facebook link', () => {
    render(<AboutPage />);
    const link = screen.getByRole('link', { name: /UAGenealogy на Facebook/i });
    expect(link).toHaveAttribute(
      'href',
      'https://www.facebook.com/groups/425347154227812',
    );
  });

  it('still renders УГФ link', () => {
    render(<AboutPage />);
    const link = screen.getByRole('link', { name: /УГФ/i });
    expect(link).toHaveAttribute('href', 'https://ukrgenealogy.com.ua/');
  });
});
