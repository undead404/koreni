'use client';
import { lazy, Suspense, useState } from 'react';

import type { ContactProperties } from './contact';

const Contact = lazy(() => import('./contact'));

// Make user click a button to show email address via lazy loading
export const ContactGate: React.FC<ContactProperties> = (properties) => {
  const [showingEmail, setShowingEmail] = useState(false);

  const email = showingEmail ? (
    <Contact contact={properties.contact} />
  ) : (
    <button type="button" onClick={() => setShowingEmail(true)}>
      Показати
    </button>
  );
  return <Suspense fallback={<span>Зачекайте...</span>}>{email}</Suspense>;
};

export default ContactGate;
