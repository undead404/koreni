import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getTodayLocalDate,
  VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY,
} from '@/app/helpers/volunteer-contact-consent';

import ContactGate from './contact-gate';

vi.mock('./contact', () => ({
  default: ({ contact }: { contact: string }) => (
    <div data-testid="contact-info">{contact}</div>
  ),
}));

beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(
    this: HTMLDialogElement,
  ) {
    this.removeAttribute('open');
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const consentButtonName = /я вже дослідив\(ла\) усе, що можливо/i;

describe('ContactGate', () => {
  it('asks for prose-only consent before revealing the requested email', () => {
    render(<ContactGate contact="test@example.com" />);

    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/опрацюйте доступні матеріали/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog').querySelector('a')).toBeNull();
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Поки зарано' })).toHaveFocus();
    expect(
      screen
        .getByRole('button', { name: 'Поки зарано' })
        .compareDocumentPosition(
          screen.getByRole('button', { name: consentButtonName }),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('stores today before revealing the email after affirmation', async () => {
    render(<ContactGate contact="test@example.com" />);
    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));
    fireEvent.click(screen.getByRole('button', { name: consentButtonName }));

    expect(localStorage.getItem(VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY)).toBe(
      getTodayLocalDate(),
    );
    expect(await screen.findByTestId('contact-info')).toHaveTextContent(
      'test@example.com',
    );
  });

  it('still reveals this request when storage write fails and prompts on a new gate', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    const { unmount } = render(<ContactGate contact="test@example.com" />);
    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));
    fireEvent.click(screen.getByRole('button', { name: consentButtonName }));

    expect(await screen.findByTestId('contact-info')).toHaveTextContent(
      'test@example.com',
    );
    unmount();
    render(<ContactGate contact="second@example.com" />);
    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it.each(['decline', 'escape', 'close', 'backdrop'] as const)(
    'does not reveal or store consent when dismissed by %s and permits retry',
    (dismissal) => {
      render(<ContactGate contact="test@example.com" />);
      fireEvent.click(screen.getByRole('button', { name: 'Показати' }));

      switch (dismissal) {
        case 'decline': {
          fireEvent.click(screen.getByRole('button', { name: 'Поки зарано' }));
          break;
        }
        case 'escape': {
          fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
          break;
        }
        case 'close': {
          fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
          break;
        }
        case 'backdrop': {
          fireEvent.click(screen.getByRole('dialog'), {
            clientX: 2,
            clientY: 2,
          });
          break;
        }
      }

      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
      expect(
        localStorage.getItem(VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY),
      ).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Показати' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    },
  );

  it('reuses same-day consent for a later explicit click without opening a dialog', async () => {
    localStorage.setItem(
      VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY,
      getTodayLocalDate(),
    );
    render(<ContactGate contact="test@example.com" />);

    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByTestId('contact-info')).toHaveTextContent(
      'test@example.com',
    );
  });

  it('uses a valid cross-tab acceptance for a later click and a pending request only', async () => {
    const { unmount } = render(<ContactGate contact="test@example.com" />);
    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));
    localStorage.setItem(
      VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY,
      getTodayLocalDate(),
    );
    dispatchEvent(
      new StorageEvent('storage', {
        key: VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY,
        newValue: getTodayLocalDate(),
      }),
    );

    expect(await screen.findByTestId('contact-info')).toHaveTextContent(
      'test@example.com',
    );
    unmount();

    const { unmount: unmountUnrequested } = render(
      <ContactGate contact="not-requested@example.com" />,
    );
    dispatchEvent(
      new StorageEvent('storage', {
        key: VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY,
        newValue: getTodayLocalDate(),
      }),
    );
    expect(
      screen.queryByText('not-requested@example.com'),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));
    expect(await screen.findByTestId('contact-info')).toHaveTextContent(
      'not-requested@example.com',
    );
    unmountUnrequested();
  });

  it('rejects stale or malformed markers and checks the local date on each request', () => {
    localStorage.setItem(VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY, 'bad');
    render(<ContactGate contact="test@example.com" />);
    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Поки зарано' }));
    localStorage.setItem(
      VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY,
      getTodayLocalDate(),
    );
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 0, 2, 12));
    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('prompts on storage read failure, then reveals only the affirmed request', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    render(<ContactGate contact="test@example.com" />);

    fireEvent.click(screen.getByRole('button', { name: 'Показати' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: consentButtonName }));
    expect(await screen.findByTestId('contact-info')).toHaveTextContent(
      'test@example.com',
    );
  });
});
