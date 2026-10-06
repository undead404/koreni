import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import AccountPage from './page';

const mockReplace = vi.fn();
const mockRouter = { replace: mockReplace };
const server = setupServer(
  http.get('*/api/auth/me', () =>
    HttpResponse.json({ user: { email: 'user@example.com', id: '1' } }),
  ),
  http.get('*/api/auth/email-visibility', () =>
    HttpResponse.json({ show_email: true }),
  ),
  http.put('*/api/auth/email-visibility', () =>
    HttpResponse.json({ show_email: true, rebuild_status: 'queued' }),
  ),
);

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('AccountPage', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterAll(() => {
    server.close();
  });

  afterEach(() => {
    cleanup();
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it('renders account information when authenticated', async () => {
    render(<AccountPage />);

    expect(
      await screen.findByText(/Ви увійшли як user@example.com/i),
    ).toBeInTheDocument();
  });

  it('does not present contribution history on the account overview', async () => {
    render(<AccountPage />);

    expect(
      await screen.findByRole('heading', { name: 'Ваш кабінет' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Мої внески/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Переглянути карму/i }),
    ).toBeInTheDocument();
  });

  it('redirects to /account/login when unauthenticated', async () => {
    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ user: null }, { status: 401 }),
      ),
    );

    render(<AccountPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/account/login');
    });
  });

  it('initializes and saves the preference with the exact payload and notice', async () => {
    let sentBody: unknown;
    server.use(
      http.put('*/api/auth/email-visibility', async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({
          show_email: false,
          rebuild_status: 'queued',
        });
      }),
    );

    render(<AccountPage />);
    const checkbox = await screen.findByRole('checkbox', {
      name: 'Показувати мою контактну електронну пошту у профілі волонтера',
    });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    fireEvent.click(
      screen.getByRole('button', { name: 'Зберегти налаштування' }),
    );

    expect(
      await screen.findByText(
        'Зміни з’являться на сайті після його перебудови.',
      ),
    ).toBeInTheDocument();
    expect(sentBody).toStrictEqual({ show_email: false });
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', {
          name: 'Показувати мою контактну електронну пошту у профілі волонтера',
        }),
      ).not.toBeChecked(),
    );
  });

  it('reports dispatch failure and allows retrying the same preference', async () => {
    const sentBodies: unknown[] = [];
    server.use(
      http.put('*/api/auth/email-visibility', async ({ request }) => {
        sentBodies.push(await request.json());
        return HttpResponse.json({
          show_email: true,
          rebuild_status: 'dispatch_failed',
        });
      }),
    );

    render(<AccountPage />);
    await screen.findByRole('checkbox');
    const save = screen.getByRole('button', { name: 'Зберегти налаштування' });
    fireEvent.click(save);
    expect(
      await screen.findByText(
        'Налаштування збережено, але не вдалося запустити перебудову сайту. Повторіть збереження, щоб спробувати ще раз.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(save);

    await waitFor(() => {
      expect(sentBodies).toHaveLength(2);
    });
    expect(sentBodies).toStrictEqual([
      { show_email: true },
      { show_email: true },
    ]);
  });

  it('shows a recoverable error when visibility preference cannot load', async () => {
    server.use(
      http.get('*/api/auth/email-visibility', () =>
        HttpResponse.json({ error: 'Unavailable' }, { status: 500 }),
      ),
    );

    render(<AccountPage />);

    expect(
      await screen.findByText(
        'Не вдалося завантажити налаштування видимості електронної пошти. Спробуйте ще раз.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Спробувати ще раз' }),
    ).toBeInTheDocument();
  });
});
