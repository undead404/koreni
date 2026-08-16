import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SpreadSplitModal from './spread-split-modal';

const defaultProps = {
  imageUrl: 'https://example.com/image.jpg',
  imageWidth: 800,
  imageHeight: 600,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('SpreadSplitModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the heading', () => {
    render(<SpreadSplitModal {...defaultProps} />);
    expect(screen.getByText('Розділити розворот')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    render(<SpreadSplitModal {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: 'Підтвердити' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Скасувати' }),
    ).toBeInTheDocument();
  });

  it('renders the page labels', () => {
    render(<SpreadSplitModal {...defaultProps} />);
    expect(screen.getByText('Сторінка 1')).toBeInTheDocument();
    expect(screen.getByText('Сторінка 2')).toBeInTheDocument();
  });

  it('renders the divider with separator role', () => {
    render(<SpreadSplitModal {...defaultProps} />);
    expect(
      screen.getByRole('separator', { name: 'Лінія розділення' }),
    ).toBeInTheDocument();
  });

  it('calls onConfirm with the current cropX when confirm is clicked', () => {
    const onConfirm = vi.fn();
    render(<SpreadSplitModal {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
    expect(onConfirm).toHaveBeenCalledWith(0.5);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<SpreadSplitModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn();
    render(<SpreadSplitModal {...defaultProps} onCancel={onCancel} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders dialog with aria-modal and aria-labelledby', () => {
    render(<SpreadSplitModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('renders the image with alt text', () => {
    render(<SpreadSplitModal {...defaultProps} />);
    expect(
      screen.getByAltText('Попередній перегляд розвороту'),
    ).toBeInTheDocument();
  });
});
