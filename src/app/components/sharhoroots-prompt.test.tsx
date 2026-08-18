import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as useHook from '../hooks/use-sharhoroots-prompt';

import SharhorootsPrompt from './sharhoroots-prompt';

// jsdom does not implement HTMLDialogElement.showModal / close
beforeEach(() => {
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

describe('SharhorootsPrompt', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders nothing when isVisible is false', () => {
    vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
      isVisible: false,
      dismiss: vi.fn(),
    });

    const { container } = render(<SharhorootsPrompt />);

    expect(
      screen.queryByText('А чи не з Шаргородщини ти випадково?'),
    ).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  describe('Step 1: Banner', () => {
    it('renders the banner question when isVisible is true', () => {
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: vi.fn(),
      });

      render(<SharhorootsPrompt />);

      expect(
        screen.getByText('А чи не з Шаргородщини ти випадково?'),
      ).toBeInTheDocument();
    });

    it('renders "Цікаво" and "Ні" buttons', () => {
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: vi.fn(),
      });

      render(<SharhorootsPrompt />);

      expect(
        screen.getByRole('button', { name: 'Цікаво' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ні' })).toBeInTheDocument();
    });

    it('clicking "Ні" calls dismiss()', () => {
      const dismissMock = vi.fn();
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: dismissMock,
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Ні' }));

      expect(dismissMock).toHaveBeenCalledOnce();
    });

    it('does not show the dialog or links initially', () => {
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: vi.fn(),
      });

      render(<SharhorootsPrompt />);

      expect(
        screen.queryByText('Генеалогія Шаргородщини, Джуринщини та Мурафщини'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /Відкрити сайт/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Step 2: Dialog', () => {
    it('clicking "Цікаво" opens the dialog with the full project name', () => {
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: vi.fn(),
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Цікаво' }));

      expect(
        screen.getByText('Генеалогія Шаргородщини, Джуринщини та Мурафщини'),
      ).toBeInTheDocument();
    });

    it('hides the banner when dialog is open', () => {
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: vi.fn(),
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Цікаво' }));

      expect(
        screen.queryByText('А чи не з Шаргородщини ти випадково?'),
      ).not.toBeInTheDocument();
    });

    it('resource link has correct href and target', () => {
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: vi.fn(),
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Цікаво' }));

      const link = screen.getByRole('link', { name: /Відкрити сайт/ });
      expect(link).toHaveAttribute(
        'href',
        'https://sharhoroots.koreni.org.ua/',
      );
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('"Спільнота на Facebook" link has correct href and target', () => {
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: vi.fn(),
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Цікаво' }));

      const link = screen.getByRole('link', {
        name: 'Спільнота на Facebook',
      });
      expect(link).toHaveAttribute(
        'href',
        'https://www.facebook.com/groups/sharhoroots',
      );
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('clicking close button (×) calls dismiss()', () => {
      const dismissMock = vi.fn();
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: dismissMock,
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Цікаво' }));
      fireEvent.click(screen.getByRole('button', { name: 'Закрити' }));

      expect(dismissMock).toHaveBeenCalledOnce();
    });

    it('clicking resource link calls dismiss()', () => {
      const dismissMock = vi.fn();
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: dismissMock,
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Цікаво' }));
      fireEvent.click(screen.getByRole('link', { name: /Відкрити сайт/ }));

      expect(dismissMock).toHaveBeenCalledOnce();
    });

    it('clicking "Спільнота на Facebook" calls dismiss()', () => {
      const dismissMock = vi.fn();
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: dismissMock,
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Цікаво' }));
      fireEvent.click(
        screen.getByRole('link', { name: 'Спільнота на Facebook' }),
      );

      expect(dismissMock).toHaveBeenCalledOnce();
    });

    it('close button has accessible aria-label', () => {
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: vi.fn(),
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Цікаво' }));

      expect(
        screen.getByRole('button', { name: 'Закрити' }),
      ).toBeInTheDocument();
    });

    it('does not close on backdrop click', () => {
      const dismissMock = vi.fn();
      vi.spyOn(useHook, 'useSharhorootsPrompt').mockReturnValue({
        isVisible: true,
        dismiss: dismissMock,
      });

      render(<SharhorootsPrompt />);

      fireEvent.click(screen.getByRole('button', { name: 'Цікаво' }));

      // Get the dialog element and simulate backdrop click
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      // Dialog should still be visible and dismiss should not have been called
      expect(
        screen.getByText('Генеалогія Шаргородщини, Джуринщини та Мурафщини'),
      ).toBeInTheDocument();
      expect(dismissMock).not.toHaveBeenCalled();
    });
  });
});
