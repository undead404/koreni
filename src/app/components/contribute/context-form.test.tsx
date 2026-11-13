import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { FormProvider } from 'react-hook-form';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import environment from '@/app/environment';

import ContextForm from './context-form';
import useContributeForm from './use-contribute-form';
vi.mock('./archive-items-input', () => ({ default: () => null }));
vi.mock('./sources-input', () => ({ default: () => null }));
vi.mock('./spatial-input', () => ({ SpatialInput: () => null }));
vi.mock('./years-input', () => ({ default: () => null }));
const endpoint = new URL(
  '/api/submissions/id-availability',
  environment.NEXT_PUBLIC_API_SITE,
).href;
const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
function Harness({ onSubmit }: { onSubmit: () => void }) {
  const form = useContributeForm();
  return (
    <form onSubmit={onSubmit}>
      <FormProvider {...form}>
        <ContextForm />
      </FormProvider>
    </form>
  );
}
describe('ID field feedback', () => {
  it('checks autofilled IDs and announces duplicates accessibly', async () => {
    server.use(
      http.get(endpoint, ({ request }) =>
        HttpResponse.json({
          id: new URL(request.url).searchParams.get('id'),
          available: false,
        }),
      ),
    );
    render(<Harness onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Назва'), {
      target: { value: 'Example title' },
    });
    const input = screen.getByLabelText('Ідентифікатор');
    expect(input).toHaveValue('example-title');
    expect(
      await screen.findByText(
        'Цей ідентифікатор уже зайнятий. Виберіть інший.',
      ),
    ).toBeVisible();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'id-availability');
    fireEvent.change(input, { target: { value: 'custom-id' } });
    fireEvent.change(screen.getByLabelText('Назва'), {
      target: { value: 'Different title' },
    });
    expect(input).toHaveValue('custom-id');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });
  it('warns on outages and retries without submitting', async () => {
    let isAvailable = false;
    server.use(
      http.get(endpoint, ({ request }) =>
        isAvailable
          ? HttpResponse.json({
              id: new URL(request.url).searchParams.get('id'),
              available: true,
            })
          : new HttpResponse(null, { status: 503 }),
      ),
    );
    const submit = vi.fn();
    render(<Harness onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText('Ідентифікатор'), {
      target: { value: 'example' },
    });
    const retry = await screen.findByRole('button', {
      name: 'Перевірити ще раз',
    });
    expect(retry).toHaveAttribute('type', 'button');
    isAvailable = true;
    fireEvent.click(retry);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Ідентифікатор вільний',
      ),
    );
    expect(submit).not.toHaveBeenCalled();
  });
});
