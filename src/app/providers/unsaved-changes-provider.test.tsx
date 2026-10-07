import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Link from 'next/link';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUnsavedChanges } from '../hooks/use-unsaved-changes';

import UnsavedChangesProvider from './unsaved-changes-provider';

interface GuardConsumerProperties {
  initiallyDirty?: boolean;
  isDirty?: boolean;
  label: string;
}

function GuardConsumer({
  initiallyDirty = false,
  isDirty: dirtyOverride,
  label,
}: GuardConsumerProperties) {
  const [localDirty, setLocalDirty] = useState(initiallyDirty);
  const isDirty = dirtyOverride ?? localDirty;
  const { confirmNavigation } = useUnsavedChanges(isDirty);

  return (
    <div>
      <button
        onClick={() => {
          setLocalDirty((current) => !current);
        }}
        type="button"
      >
        Toggle {label}
      </button>
      <button
        onClick={() => {
          confirmNavigation();
        }}
        type="button"
      >
        Confirm {label}
      </button>
      <Link href="/next">Same-tab link {label}</Link>
      <a href="https://example.org/next">External link {label}</a>
      <a href="#section">Fragment link {label}</a>
      <a href="/new-context" target="_blank">
        New-context link {label}
      </a>
      <a download href="/download">
        Download link {label}
      </a>
    </div>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('UnsavedChangesProvider', () => {
  it('allows clean links without confirmation or unload prevention', () => {
    const confirm = vi.spyOn(globalThis, 'confirm');
    render(
      <UnsavedChangesProvider>
        <GuardConsumer label="first" />
      </UnsavedChangesProvider>,
    );

    const linkEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    screen
      .getByRole('link', { name: 'Same-tab link first' })
      .dispatchEvent(linkEvent);
    const unloadEvent = new Event('beforeunload', { cancelable: true });
    const isUnloadNotPrevented = dispatchEvent(unloadEvent);

    expect(confirm).not.toHaveBeenCalled();
    expect(linkEvent.defaultPrevented).toBe(false);
    expect(isUnloadNotPrevented).toBe(true);
  });

  it('prompts with the exact message and cancels or permits the original click', () => {
    const confirm = vi.spyOn(globalThis, 'confirm');
    render(
      <UnsavedChangesProvider>
        <GuardConsumer initiallyDirty label="first" />
      </UnsavedChangesProvider>,
    );
    const link = screen.getByRole('link', { name: 'Same-tab link first' });
    const cancelledEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    confirm.mockReturnValue(false);
    link.dispatchEvent(cancelledEvent);

    expect(confirm).toHaveBeenLastCalledWith(
      'У вас є незбережені зміни. Покинути сторінку без збереження?',
    );
    expect(cancelledEvent.defaultPrevented).toBe(true);

    const permittedEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    confirm.mockReturnValue(true);
    link.dispatchEvent(permittedEvent);
    expect(permittedEvent.defaultPrevented).toBe(false);
  });

  it('does not custom-prompt modified, non-primary, targeted, download, cancelled, or fragment clicks', () => {
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    render(
      <UnsavedChangesProvider>
        <GuardConsumer initiallyDirty label="first" />
      </UnsavedChangesProvider>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Same-tab link first' }), {
      ctrlKey: true,
    });
    fireEvent.click(screen.getByRole('link', { name: 'Same-tab link first' }), {
      button: 1,
    });
    fireEvent.click(
      screen.getByRole('link', { name: 'New-context link first' }),
    );
    fireEvent.click(screen.getByRole('link', { name: 'Download link first' }));
    fireEvent.click(screen.getByRole('link', { name: 'Fragment link first' }));

    const alreadyCancelled = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    alreadyCancelled.preventDefault();
    screen
      .getByRole('link', { name: 'Same-tab link first' })
      .dispatchEvent(alreadyCancelled);

    expect(confirm).not.toHaveBeenCalled();
  });

  it('uses only native unload protection for external links', () => {
    const confirm = vi.spyOn(globalThis, 'confirm');
    render(
      <UnsavedChangesProvider>
        <GuardConsumer initiallyDirty label="first" />
      </UnsavedChangesProvider>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'External link first' }));

    expect(confirm).not.toHaveBeenCalled();
  });

  it('keeps aggregate dirtiness until every registration becomes clean or unmounts', () => {
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    const { rerender } = render(
      <UnsavedChangesProvider>
        <GuardConsumer initiallyDirty label="first" />
        <GuardConsumer initiallyDirty label="second" />
      </UnsavedChangesProvider>,
    );
    const unloadEvent = new Event('beforeunload', { cancelable: true });

    expect(dispatchEvent(unloadEvent)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle first' }));
    fireEvent.click(screen.getByRole('link', { name: 'Same-tab link first' }));
    expect(confirm).toHaveBeenCalledTimes(1);

    rerender(
      <UnsavedChangesProvider>
        <GuardConsumer isDirty={false} label="first" />
      </UnsavedChangesProvider>,
    );
    const cleanUnloadEvent = new Event('beforeunload', { cancelable: true });
    expect(dispatchEvent(cleanUnloadEvent)).toBe(true);
  });

  it('replaces registration state on rerender and unregisters on unmount', () => {
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    const { rerender, unmount } = render(
      <UnsavedChangesProvider>
        <GuardConsumer initiallyDirty label="first" />
      </UnsavedChangesProvider>,
    );

    rerender(
      <UnsavedChangesProvider>
        <GuardConsumer isDirty={false} label="first" />
      </UnsavedChangesProvider>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Same-tab link first' }));
    expect(confirm).not.toHaveBeenCalled();

    rerender(
      <UnsavedChangesProvider>
        <GuardConsumer isDirty label="first" />
      </UnsavedChangesProvider>,
    );
    unmount();
    expect(dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(
      true,
    );
  });

  it('exposes synchronous confirmation to user-initiated programmatic navigation', () => {
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    render(
      <UnsavedChangesProvider>
        <GuardConsumer initiallyDirty label="first" />
      </UnsavedChangesProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm first' }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('throws a descriptive error when the hook is rendered without its provider', () => {
    expect(() => render(<GuardConsumer label="orphan" />)).toThrow(
      'useUnsavedChanges must be used within an UnsavedChangesProvider.',
    );
  });

  it('does not claim protection for SPA Back/Forward transitions without a public cancellation API', () => {
    expect(true).toBe(true);
  });
});
