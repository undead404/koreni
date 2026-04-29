import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ContactGate from './contact-gate';

// Mock the lazy-loaded Contact component
vi.mock('./contact', () => ({
  default: ({ contact }: { contact: string }) => <div data-testid="contact-info">{contact}</div>,
}));

describe('ContactGate', () => {
  afterEach(cleanup);

  it('renders the "Reveal" button by default', () => {
    render(<ContactGate contact="test@example.com" />);

    expect(screen.getByRole('button', { name: /показати/i })).toBeInTheDocument();
    expect(screen.queryByTestId('contact-info')).not.toBeInTheDocument();
  });

  it('reveals the contact component when clicked', async () => {
    render(<ContactGate contact="test@example.com" />);

    const button = screen.getByRole('button', { name: /показати/i });
    fireEvent.click(button);

    // findBy* queries handle the async nature of lazy loading and Suspense
    const contactInfo = await screen.findByTestId('contact-info');
    expect(contactInfo).toBeInTheDocument();
    expect(contactInfo).toHaveTextContent('test@example.com');

    // The button should be removed from the DOM
    expect(screen.queryByRole('button', { name: /показати/i })).not.toBeInTheDocument();
  });
});
