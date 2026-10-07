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

import environment from '../environment';
import UnsavedChangesProvider from '../providers/unsaved-changes-provider';

import AccountPage from './page';

const mockReplace = vi.fn();
const mockRouter = { replace: mockReplace };
const apiOrigin = new URL(environment.NEXT_PUBLIC_API_SITE).origin;
const accountEndpoint = `${apiOrigin}/api/auth/me`;
const visibilityEndpoint = `${apiOrigin}/api/auth/email-visibility`;
const defaultUserPayload = { user: { email: 'user@example.com', id: '1' } };
let respondToAccountGet = () => HttpResponse.json(defaultUserPayload);
let respondToVisibilityGet = () => HttpResponse.json({ show_email: true });
let respondToVisibilityPut = (body: unknown): Promise<Response> => {
  if (
    typeof body === 'object' &&
    body !== null &&
    'show_email' in body &&
    typeof body.show_email === 'boolean'
  ) {
    return Promise.resolve(
      HttpResponse.json({
        show_email: body.show_email,
        rebuild_status: 'queued',
      }),
    );
  }
  return Promise.resolve(
    HttpResponse.json({ error: 'Invalid request' }, { status: 400 }),
  );
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

const server = setupServer(
  http.get(accountEndpoint, () => respondToAccountGet()),
  http.get(visibilityEndpoint, () => respondToVisibilityGet()),
  http.put(visibilityEndpoint, async ({ request }) =>
    respondToVisibilityPut(await request.json()),
  ),
);

const renderAccountPage = () =>
  render(
    <UnsavedChangesProvider>
      <AccountPage />
    </UnsavedChangesProvider>,
  );

const visibilityLabel =
  'Зробити мою контактну електронну пошту загальнодоступною в профілі волонтера';

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterAll(() => {
  server.close();
});

describe('AccountPage', () => {
  afterEach(() => {
    cleanup();
    server.resetHandlers();
    respondToAccountGet = () => HttpResponse.json(defaultUserPayload);
    respondToVisibilityGet = () => HttpResponse.json({ show_email: true });
    respondToVisibilityPut = (body: unknown): Promise<Response> => {
      if (
        typeof body === 'object' &&
        body !== null &&
        'show_email' in body &&
        typeof body.show_email === 'boolean'
      ) {
        return Promise.resolve(
          HttpResponse.json({
            show_email: body.show_email,
            rebuild_status: 'queued',
          }),
        );
      }
      return Promise.resolve(
        HttpResponse.json({ error: 'Invalid request' }, { status: 400 }),
      );
    };
    vi.restoreAllMocks();
  });

  it('renders authenticated account information and the exact preference wording', async () => {
    renderAccountPage();

    expect(
      await screen.findByText('Ви увійшли як user@example.com'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('checkbox', { name: visibilityLabel }),
    ).toBeChecked();
    expect(
      screen.queryByText(
        'Налаштуйте, чи показувати адреси, зіставлені з вашим акаунтом, у профілі волонтера.',
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Мої внески/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Переглянути карму/i }),
    ).toBeInTheDocument();
  });

  it('redirects to /account/login when unauthenticated', async () => {
    respondToAccountGet = () =>
      HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });

    renderAccountPage();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/account/login');
    });
  });

  it('tracks changes from the saved baseline and clears dirty state when restored', async () => {
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    renderAccountPage();

    const checkbox = await screen.findByRole('checkbox', {
      name: visibilityLabel,
    });
    const link = screen.getByRole('link', { name: /Переглянути карму/i });
    fireEvent.click(checkbox);
    fireEvent.click(link);
    expect(confirm).toHaveBeenCalledTimes(1);

    fireEvent.click(checkbox);
    fireEvent.click(link);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('saves the preference, updates its baseline, and keeps the clean-state retry available', async () => {
    const sentBodies: unknown[] = [];
    respondToVisibilityPut = (body) => {
      sentBodies.push(body);
      return Promise.resolve(
        HttpResponse.json({ show_email: false, rebuild_status: 'queued' }),
      );
    };
    renderAccountPage();

    const checkbox = await screen.findByRole('checkbox', {
      name: visibilityLabel,
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
    expect(sentBodies).toStrictEqual([{ show_email: false }]);
    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: visibilityLabel }),
      ).not.toBeChecked();
    });
    expect(
      screen.getByRole('button', { name: 'Зберегти налаштування' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Зберегти налаштування' }).className,
    ).toContain('saveButton');
  });

  it('treats dispatch failure as saved and allows an idempotent retry', async () => {
    const sentBodies: unknown[] = [];
    respondToVisibilityPut = (body) => {
      sentBodies.push(body);
      return Promise.resolve(
        HttpResponse.json({
          show_email: true,
          rebuild_status: 'dispatch_failed',
        }),
      );
    };
    renderAccountPage();

    const save = await screen.findByRole('button', {
      name: 'Зберегти налаштування',
    });
    fireEvent.click(save);
    expect(
      await screen.findByText(
        'Налаштування збережено, але не вдалося запустити перебудову сайту. Повторіть збереження, щоб спробувати ще раз.',
      ),
    ).toBeInTheDocument();
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByRole('link', { name: /Переглянути карму/i }));
    expect(confirm).not.toHaveBeenCalled();

    fireEvent.click(save);
    await waitFor(() => {
      expect(sentBodies).toHaveLength(2);
    });
    expect(sentBodies).toStrictEqual([
      { show_email: true },
      { show_email: true },
    ]);
  });

  it('retains a dirty draft and shows the existing error after a failed or malformed save', async () => {
    respondToVisibilityPut = () =>
      Promise.resolve(HttpResponse.json({ invalid: true }));
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    renderAccountPage();

    const checkbox = await screen.findByRole('checkbox', {
      name: visibilityLabel,
    });
    fireEvent.click(checkbox);
    fireEvent.click(
      screen.getByRole('button', { name: 'Зберегти налаштування' }),
    );
    expect(
      await screen.findByText(
        'Не вдалося зберегти налаштування. Перевірте з’єднання та спробуйте ще раз.',
      ),
    ).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    fireEvent.click(screen.getByRole('link', { name: /Переглянути карму/i }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('protects a pending save and clears protection after a valid response', async () => {
    const requestGate = Promise.withResolvers<undefined>();
    respondToVisibilityPut = async () => {
      await requestGate.promise;
      return HttpResponse.json({ show_email: true, rebuild_status: 'queued' });
    };
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    renderAccountPage();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Зберегти налаштування' }),
    );
    await screen.findByRole('button', { name: 'Збереження...' });
    fireEvent.click(screen.getByRole('link', { name: /Переглянути карму/i }));
    expect(confirm).toHaveBeenCalledTimes(1);

    requestGate.resolve(undefined);
    await screen.findByText('Зміни з’являться на сайті після його перебудови.');
    fireEvent.click(screen.getByRole('link', { name: /Переглянути карму/i }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable error when visibility preference cannot load', async () => {
    respondToVisibilityGet = () =>
      HttpResponse.json({ error: 'Unavailable' }, { status: 503 });

    renderAccountPage();

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
