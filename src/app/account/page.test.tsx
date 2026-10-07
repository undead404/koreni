import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import AccountPage from './page';

const mockReplace = vi.fn();
const mockRouter = { replace: mockReplace };

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/app/services/api', () => ({ default: vi.fn() }));

describe('AccountPage', () => {
  beforeEach(() => {
    vi.mocked(requestApi).mockImplementation((path) => {
      if (path === '/api/auth/me') {
        return Promise.resolve(
          Response.json({ user: { email: 'user@example.com', id: '1' } }),
        );
      }
      if (path === '/api/auth/email-visibility') {
        return Promise.resolve(Response.json({ show_email: true }));
      }
      return Promise.reject(new Error(`Unexpected API request: ${path}`));
    });
  });

  afterEach(() => {
    cleanup();
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
    vi.mocked(requestApi).mockImplementation((path) => {
      if (path === '/api/auth/me') {
        return Promise.reject(new Error('Unauthenticated'));
      }
      return Promise.resolve(Response.json({ show_email: true }));
    });

    render(<AccountPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/account/login');
    });
  });

  it('initializes and saves the preference with the exact payload and notice', async () => {
    let sentBody: BodyInit | null | undefined;
    vi.mocked(requestApi).mockImplementation((path, parameters) => {
      if (path === '/api/auth/me') {
        return Promise.resolve(
          Response.json({ user: { email: 'user@example.com', id: '1' } }),
        );
      }
      if (
        path === '/api/auth/email-visibility' &&
        parameters?.method === 'PUT'
      ) {
        sentBody = parameters.body;
        return Promise.resolve(
          Response.json({ show_email: false, rebuild_status: 'queued' }),
        );
      }
      return Promise.resolve(Response.json({ show_email: true }));
    });

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
    expect(sentBody).toBe(JSON.stringify({ show_email: false }));
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', {
          name: 'Показувати мою контактну електронну пошту у профілі волонтера',
        }),
      ).not.toBeChecked(),
    );
  });

  it('reports dispatch failure and allows retrying the same preference', async () => {
    const sentBodies: (BodyInit | null | undefined)[] = [];
    vi.mocked(requestApi).mockImplementation((path, parameters) => {
      if (path === '/api/auth/me') {
        return Promise.resolve(
          Response.json({ user: { email: 'user@example.com', id: '1' } }),
        );
      }
      if (
        path === '/api/auth/email-visibility' &&
        parameters?.method === 'PUT'
      ) {
        sentBodies.push(parameters.body);
        return Promise.resolve(
          Response.json({
            show_email: true,
            rebuild_status: 'dispatch_failed',
          }),
        );
      }
      return Promise.resolve(Response.json({ show_email: true }));
    });

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
      JSON.stringify({ show_email: true }),
      JSON.stringify({ show_email: true }),
    ]);
  });

  it('shows a recoverable error when visibility preference cannot load', async () => {
    vi.mocked(requestApi).mockImplementation((path) => {
      if (path === '/api/auth/me') {
        return Promise.resolve(
          Response.json({ user: { email: 'user@example.com', id: '1' } }),
        );
      }
      return Promise.reject(new Error('Unavailable'));
    });

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
