import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import requestApi from '@/app/services/api';

import KarmaConnectionsPage from './page';

const replace = vi.fn();
const router = { replace };

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

vi.mock('@/app/services/api', () => ({
  default: vi.fn(),
  ApiRequestError: class ApiRequestError extends Error {
    public readonly status: number;

    public constructor(status: number) {
      super();
      this.status = status;
    }
  },
}));

describe('KarmaConnectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows contribution statistics and linking form for an unlinked account', async () => {
    vi.mocked(requestApi).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          tables: 2,
          rows: 123,
          user: { email: 'user@example.com', karma_linked_at: null },
        }),
      ),
    );

    render(<KarmaConnectionsPage />);

    expect(
      await screen.findByText(
        (_, element) =>
          element?.tagName === 'P' && element.textContent.includes('2 таблиць'),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          element.textContent.includes('123 рядків'),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Код із Генеалогічного навігатора'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Прив’язати акаунт' }),
    ).toBeDisabled();
  });

  it('submits the code and displays the linked state', async () => {
    vi.mocked(requestApi).mockImplementation((path) => {
      if (path === '/api/karma/link') {
        return Promise.resolve(
          new Response(JSON.stringify({ awarded: 12, ok: true })),
        );
      }
      if (path === '/api/karma/lookup') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              found: true,
              serviceKarma: 12,
              totalKarma: 42,
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            tables: 2,
            rows: 123,
            user: { email: 'user@example.com', karma_linked_at: null },
          }),
        ),
      );
    });

    render(<KarmaConnectionsPage />);
    const input = await screen.findByLabelText(
      'Код із Генеалогічного навігатора',
    );
    fireEvent.change(input, { target: { value: 'ab12cd34ef' } });
    fireEvent.click(screen.getByRole('button', { name: 'Прив’язати акаунт' }));

    await waitFor(() => {
      expect(
        screen.getByText("Акаунт успішно прив'язано.", { exact: true }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Акаунт успішно прив'язано."),
      ).toBeInTheDocument();
    });
    expect(requestApi).toHaveBeenCalledWith('/api/karma/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'AB12CD34EF' }),
    });
    expect(requestApi).toHaveBeenCalledWith('/api/karma/lookup', {
      signal: expect.any(AbortSignal),
    });
    expect(await screen.findByText('Карма від Koreni')).toBeInTheDocument();
    expect(screen.getByText('12', { selector: 'dd' })).toBeInTheDocument();
    expect(
      screen.getByText("Під час прив'язки нараховано 12 балів карми."),
    ).toBeInTheDocument();
  });

  it('shows Navigator karma for a linked account', async () => {
    vi.mocked(requestApi).mockImplementation((path) => {
      if (path === '/api/karma/lookup') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              found: true,
              serviceKarma: 381,
              totalKarma: 2487,
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            tables: 2,
            rows: 123,
            user: {
              email: 'user@example.com',
              karma_linked_at: '2026-08-23T12:00:00.000Z',
            },
          }),
        ),
      );
    });

    render(<KarmaConnectionsPage />);

    expect(await screen.findByText('Карма від Koreni')).toBeInTheDocument();
    expect(screen.getByText('381', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText('2487', { selector: 'dd' })).toBeInTheDocument();
  });

  it('shows contact instructions when no contribution is found', async () => {
    vi.mocked(requestApi).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          tables: 0,
          rows: 0,
          user: { email: 'user@example.com', karma_linked_at: null },
        }),
      ),
    );

    render(<KarmaConnectionsPage />);

    expect(
      await screen.findByText(
        /Таблиць за цією електронною адресою не знайдено/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'admin@koreni.org.ua' }),
    ).toHaveAttribute('href', 'mailto:admin@koreni.org.ua');
  });
});
