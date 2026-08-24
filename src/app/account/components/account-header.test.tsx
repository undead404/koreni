import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import AccountHeader from './account-header';

const mockUsePathname = vi.fn().mockReturnValue('/account');
const mockReplace = vi.fn();
const mockEnvironment = vi.hoisted(() => ({
  NEXT_PUBLIC_ENABLE_TRANSCRIBE: true,
}));

vi.mock('@/app/environment', () => ({ default: mockEnvironment }));

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/app/services/api', () => ({
  default: vi.fn(),
}));

vi.mock('./logout-button', () => ({
  default: () => <button>Log Out</button>,
}));

describe('AccountHeader', () => {
  interface BreadcrumbTestCase {
    hrefs: string[];
    labels: string[];
    pathname: string;
  }

  const breadcrumbTestCases: BreadcrumbTestCase[] = [
    { pathname: '/account', labels: ['Головна', 'Кабінет'], hrefs: ['/'] },
    {
      pathname: '/account/login',
      labels: ['Головна', 'Кабінет', 'Вхід'],
      hrefs: ['/', '/account'],
    },
    {
      pathname: '/account/karma',
      labels: ['Головна', 'Кабінет', 'Карма'],
      hrefs: ['/', '/account'],
    },
    {
      pathname: '/account/transcribe',
      labels: ['Головна', 'Кабінет', 'Транскрипція'],
      hrefs: ['/', '/account'],
    },
    {
      pathname: '/account/transcribe/create',
      labels: ['Головна', 'Кабінет', 'Транскрипція', 'Створення проєкту'],
      hrefs: ['/', '/account', '/account/transcribe'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnvironment.NEXT_PUBLIC_ENABLE_TRANSCRIBE = true;
  });

  afterEach(() => {
    cleanup();
  });

  it('hides logout button on /account while in loading state', () => {
    mockUsePathname.mockReturnValue('/account');
    vi.mocked(requestApi).mockReturnValue(new Promise(() => {}));

    render(<AccountHeader />);

    expect(screen.getByText('Кабінет')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('hides identity and logout button on /account when unauthenticated', async () => {
    mockUsePathname.mockReturnValue('/account');
    vi.mocked(requestApi).mockRejectedValue(new Error('Request failed'));

    render(<AccountHeader />);

    expect(screen.getByText('Кабінет')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/account/login?returnTo=%2Faccount',
      );
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('renders identity and logout button on /account when authenticated', async () => {
    mockUsePathname.mockReturnValue('/account');
    vi.mocked(requestApi).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ user: { email: 'user@example.com', id: 'usr_1' } }),
    } as Response);

    render(<AccountHeader />);

    expect(screen.getByText('Кабінет')).toBeInTheDocument();
    expect(await screen.findByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
  });

  it('hides all user controls on /account/login and /account/login/ regardless of auth state', () => {
    for (const pathname of ['/account/login', '/account/login/']) {
      mockUsePathname.mockReturnValue(pathname);

      const { unmount } = render(<AccountHeader />);

      expect(screen.getByText('Вхід')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Log Out' }),
      ).not.toBeInTheDocument();
      expect(requestApi).not.toHaveBeenCalled();

      unmount();
    }
  });

  it.each(breadcrumbTestCases)(
    'renders breadcrumbs for $pathname',
    ({ pathname, labels, hrefs }) => {
      mockUsePathname.mockReturnValue(pathname);

      render(<AccountHeader />);

      const navigation = screen.getByRole('navigation', {
        name: 'Навігація кабінету',
      });
      const breadcrumbItems = within(navigation).getAllByRole('listitem');

      expect(breadcrumbItems.map((item) => item.textContent)).toStrictEqual(
        labels,
      );
      expect(
        within(navigation)
          .getAllByRole('link')
          .map((link) => link.getAttribute('href')),
      ).toStrictEqual(hrefs);

      const currentItem = breadcrumbItems.at(-1);
      if (!currentItem) throw new Error('Expected a current breadcrumb');
      expect(
        within(currentItem).getByText(labels.at(-1) ?? ''),
      ).toHaveAttribute('aria-current', 'page');
      expect(within(currentItem).queryByRole('link')).not.toBeInTheDocument();
    },
  );

  it('uses a safe fallback for unsupported account routes', () => {
    mockUsePathname.mockReturnValue('/account/unknown');

    render(<AccountHeader />);

    const navigation = screen.getByRole('navigation', {
      name: 'Навігація кабінету',
    });
    expect(
      within(navigation)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toStrictEqual(['Головна', 'Кабінет']);
  });

  it('treats trailing slashes as equivalent route paths', () => {
    mockUsePathname.mockReturnValue('/account/transcribe/create/');

    render(<AccountHeader />);

    expect(screen.getByText('Створення проєкту')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Транскрипція' })).toHaveAttribute(
      'href',
      '/account/transcribe',
    );
  });

  it('hides transcription breadcrumbs when the feature is disabled', () => {
    mockEnvironment.NEXT_PUBLIC_ENABLE_TRANSCRIBE = false;
    mockUsePathname.mockReturnValue('/account/transcribe');

    render(<AccountHeader />);

    expect(screen.queryByText('Транскрипція')).not.toBeInTheDocument();
    expect(screen.getByText('Кабінет')).toBeInTheDocument();
  });
});
