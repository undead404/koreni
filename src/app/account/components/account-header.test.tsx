import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { SWRConfig } from 'swr';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import AccountHeader from './account-header';

const mockUsePathname = vi.fn().mockReturnValue('/account');
const mockUseSearchParameters = vi.fn().mockReturnValue(new URLSearchParams());
const mockReplace = vi.fn();
const mockRouter = { replace: mockReplace };
const mockEnvironment = vi.hoisted(() => ({
  NEXT_PUBLIC_API_SITE: 'http://localhost:3000',
  NEXT_PUBLIC_ENABLE_TRANSCRIBE: true,
}));

const project = (id: string, title: string) => ({
  id,
  isHandwritten: true,
  location: [48.9, 24.5],
  sources: [],
  tableLocale: 'uk',
  title,
  type: 'table',
  yearsRange: [1850, 1900],
});

const server = setupServer(
  http.get('*/api/auth/me', () => new HttpResponse(null, { status: 401 })),
);

vi.mock('@/app/environment', () => ({ default: mockEnvironment }));

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParameters(),
  useRouter: () => mockRouter,
}));

vi.mock('./logout-button', () => ({
  default: () => <button>Log Out</button>,
}));

const renderHeader = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <AccountHeader />
    </SWRConfig>,
  );

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
      labels: ['Головна', 'Кабінет', 'Транскрибування'],
      hrefs: ['/', '/account'],
    },
    {
      pathname: '/account/transcribe/project',
      labels: ['Головна', 'Кабінет', 'Транскрибування'],
      hrefs: ['/', '/account'],
    },
    {
      pathname: '/account/transcribe/create',
      labels: ['Головна', 'Кабінет', 'Транскрибування', 'Створення проєкту'],
      hrefs: ['/', '/account', '/account/transcribe'],
    },
  ];

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnvironment.NEXT_PUBLIC_ENABLE_TRANSCRIBE = true;
    mockUseSearchParameters.mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    cleanup();
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('hides logout button on /account while in loading state', () => {
    mockUsePathname.mockReturnValue('/account');
    renderHeader();

    expect(screen.getByText('Кабінет')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log Out' }),
    ).not.toBeInTheDocument();
  });

  it('hides identity and logout button on /account when unauthenticated', async () => {
    mockUsePathname.mockReturnValue('/account');
    renderHeader();

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
    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ user: { email: 'user@example.com', id: 'usr_1' } }),
      ),
    );

    renderHeader();

    expect(screen.getByText('Кабінет')).toBeInTheDocument();
    const userIdentity = await screen.findByText('user@example.com');
    expect(userIdentity).toBeInTheDocument();
    expect(userIdentity.parentElement).toHaveClass('userControls');
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
  });

  it('hides all user controls on /account/login and /account/login/ regardless of auth state', () => {
    for (const pathname of ['/account/login', '/account/login/']) {
      mockUsePathname.mockReturnValue(pathname);

      const { unmount } = renderHeader();

      expect(screen.getByText('Вхід')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Log Out' }),
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it.each(breadcrumbTestCases)(
    'renders breadcrumbs for $pathname',
    ({ pathname, labels, hrefs }) => {
      mockUsePathname.mockReturnValue(pathname);

      renderHeader();

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

    renderHeader();

    const navigation = screen.getByRole('navigation', {
      name: 'Навігація кабінету',
    });
    expect(
      within(navigation)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toStrictEqual(['Головна', 'Кабінет']);
  });

  it('renders the project title in the project breadcrumb', async () => {
    mockUsePathname.mockReturnValue('/account/transcribe/project/');
    mockUseSearchParameters.mockReturnValue(
      new URLSearchParams('projectId=test-1'),
    );
    const projectRequest = vi.fn();
    server.use(
      http.get('*/api/transcribe/projects/:projectId', ({ params }) => {
        projectRequest(params.projectId);
        return HttpResponse.json({
          success: true,
          project: project(String(params.projectId), 'Tst'),
        });
      }),
    );

    renderHeader();

    expect(await screen.findByText('Транскрибування Tst')).toBeInTheDocument();
    expect(projectRequest).toHaveBeenCalledTimes(1);
    expect(projectRequest).toHaveBeenCalledWith('test-1');
    expect(screen.getByRole('link', { name: 'Кабінет' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('does not request project data for missing or invalid project IDs', () => {
    const projectRequest = vi.fn();
    server.use(
      http.get('*/api/transcribe/projects/:projectId', ({ params }) => {
        projectRequest(params.projectId);
        return HttpResponse.json({
          success: true,
          project: project(String(params.projectId), 'Unexpected'),
        });
      }),
    );
    mockUsePathname.mockReturnValue('/account/transcribe/project');

    const missingId = renderHeader();
    expect(projectRequest).not.toHaveBeenCalled();
    missingId.unmount();

    mockUseSearchParameters.mockReturnValue(
      new URLSearchParams('projectId=bad_id'),
    );
    renderHeader();
    expect(projectRequest).not.toHaveBeenCalled();
  });

  it('does not retain the previous title while changing project IDs', async () => {
    mockUsePathname.mockReturnValue('/account/transcribe/project');
    mockUseSearchParameters.mockReturnValue(
      new URLSearchParams('projectId=first-project'),
    );
    const projectRequests = vi.fn();
    server.use(
      http.get('*/api/transcribe/projects/:projectId', async ({ params }) => {
        const id = String(params.projectId);
        projectRequests(id);
        if (id === 'first-project') await delay(40);
        return HttpResponse.json({
          success: true,
          project: project(id, id === 'first-project' ? 'First' : 'Second'),
        });
      }),
    );

    const view = renderHeader();
    await waitFor(() => {
      expect(projectRequests).toHaveBeenCalledWith('first-project');
    });

    mockUseSearchParameters.mockReturnValue(
      new URLSearchParams('projectId=second-project'),
    );
    view.rerender(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountHeader />
      </SWRConfig>,
    );

    expect(
      await screen.findByText('Транскрибування Second'),
    ).toBeInTheDocument();
    await delay(60);
    expect(screen.queryByText('Транскрибування First')).not.toBeInTheDocument();
    expect(screen.getByText('Транскрибування Second')).toBeInTheDocument();
  });

  it('treats trailing slashes as equivalent route paths', () => {
    mockUsePathname.mockReturnValue('/account/transcribe/create/');

    renderHeader();

    expect(screen.getByText('Створення проєкту')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Транскрибування' }),
    ).toHaveAttribute('href', '/account/transcribe');
  });

  it('hides transcription breadcrumbs when the feature is disabled', () => {
    mockEnvironment.NEXT_PUBLIC_ENABLE_TRANSCRIBE = false;
    mockUsePathname.mockReturnValue('/account/transcribe');

    renderHeader();

    expect(screen.queryByText('Транскрибування')).not.toBeInTheDocument();
    expect(screen.getByText('Кабінет')).toBeInTheDocument();
  });
});
