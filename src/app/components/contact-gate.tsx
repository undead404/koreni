'use client';

import { lazy, Suspense, useState } from 'react';

import type { ContactProperties } from './contact';

const Contact = lazy(() => import('./contact'));

/**
 * Renders a gate (button) that reveals contact details when clicked.
 * Uses lazy loading to keep contact information out of the initial bundle/DOM
 * to mitigate simple scraping.
 */
export function ContactGate({ contact }: ContactProperties) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (isRevealed) {
    return (
      <Suspense fallback={<span>Зачекайте...</span>}>
        <Contact contact={contact} />
      </Suspense>
    );
  }

  return (
    <button type="button" onClick={() => setIsRevealed(true)}>
      Показати
    </button>
  );
}

export default ContactGate;
