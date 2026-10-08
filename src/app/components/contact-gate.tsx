'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import {
  hasStoredVolunteerContactConsentForToday,
  hasVolunteerContactConsentForToday,
  isVolunteerContactConsentCurrent,
  VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY,
} from '@/app/helpers/volunteer-contact-consent';

import type { ContactProperties } from './contact';
import Modal from './modal';

import styles from './contact-gate.module.css';

const Contact = lazy(() => import('./contact'));

/**
 * Renders a gate (button) that reveals contact details when clicked.
 * Uses lazy loading to keep contact information out of the initial bundle/DOM
 * to mitigate simple scraping.
 */
export function ContactGate({ contact }: ContactProperties) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isConsentDialogOpen, setIsConsentDialogOpen] = useState(false);
  const [hasPendingReveal, setHasPendingReveal] = useState(false);
  const declineButtonReference = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== VOLUNTEER_CONTACT_CONSENT_STORAGE_KEY ||
        !isVolunteerContactConsentCurrent(event.newValue)
      ) {
        return;
      }

      if (hasPendingReveal) {
        setIsRevealed(true);
        setIsConsentDialogOpen(false);
        setHasPendingReveal(false);
      }
    };

    addEventListener('storage', handleStorage);
    return () => {
      removeEventListener('storage', handleStorage);
    };
  }, [hasPendingReveal]);

  useEffect(() => {
    if (isConsentDialogOpen) declineButtonReference.current?.focus();
  }, [isConsentDialogOpen]);

  if (isRevealed) {
    return (
      <Suspense fallback={<span>Зачекайте...</span>}>
        <Contact contact={contact} />
      </Suspense>
    );
  }

  const requestReveal = () => {
    if (hasVolunteerContactConsentForToday()) {
      setIsRevealed(true);
      return;
    }

    setHasPendingReveal(true);
    setIsConsentDialogOpen(true);
  };

  const declineConsent = () => {
    setIsConsentDialogOpen(false);
    setHasPendingReveal(false);
  };

  const affirmConsent = () => {
    hasStoredVolunteerContactConsentForToday();
    if (hasPendingReveal) setIsRevealed(true);
    setIsConsentDialogOpen(false);
    setHasPendingReveal(false);
  };

  return (
    <>
      <button
        type="button"
        className={styles.revealButton}
        onClick={requestReveal}
      >
        Показати
      </button>
      <Modal
        className={styles.dialog}
        isOpen={isConsentDialogOpen}
        onClose={declineConsent}
        title="Перш ніж звернутися до волонтера"
      >
        <div className={styles.content}>
          <p>
            Перш ніж просити про допомогу, опрацюйте доступні матеріали й
            посилання самостійно. Якщо після цього з&apos;явилися якісь
            конкретні питання, котрі не вдається вирішити самотужки, – тільки
            тоді звертайтеся до автора індексації.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.declineButton}
              ref={declineButtonReference}
              onClick={declineConsent}
            >
              Поки зарано
            </button>
            <button
              type="button"
              className={styles.affirmButton}
              onClick={affirmConsent}
            >
              Я вже дослідив(ла) усе, що можливо; хочу зв&apos;язатися з автором
              індексації
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ContactGate;
