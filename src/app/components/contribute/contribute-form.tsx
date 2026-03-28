'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import Turnstile, { useTurnstile } from 'react-turnstile';

import environment from '@/app/environment';

import Loader from '../loader';

import {
  type SubmissionStage,
  useContributionStateStore,
} from './contribution-state';
import { KnownLocationsContext } from './known-locations-context';
import { useTableStateStore } from './table-state';
import type { ContributeFormProperties } from './types';
import useContributeForm from './use-contribute-form';
import useSubmitContribution from './use-submit-contribution';

import styles from './contribute-form.module.css';

const ContributeFormStepper = dynamic(() => import('./stepper'), {
  ssr: false,
  loading: () => <Loader />,
});

const STAGE_LABELS: Record<SubmissionStage, string> = {
  conversion: 'Обробка даних',
  idle: 'Просторові дані',
  transmission: 'Передача даних',
  verification: 'Перевірка на людяність',
};

export default function ContributeForm({
  knownLocations,
}: ContributeFormProperties) {
  const form = useContributeForm();
  const { getAllColumns, getTableAsObjects } = useTableStateStore();
  const turnstile = useTurnstile() as { reset: () => void };

  const [turnstileToken, setTurnstileToken] = useState('');

  const { state: contributionState } = useContributionStateStore();

  const { handleFormSubmit, isSubmitting, stage } = useSubmitContribution({
    form,
    turnstileToken,
    turnstile,
    getAllColumns,
    getTableAsObjects,
  });

  return (
    <form className={styles.container} onSubmit={handleFormSubmit}>
      <div className={styles.header}>
        <h1 className={styles.title}>Додавання таблиці</h1>
        <p className={styles.description}>
          Пройдіть стежкою вниз, аби завантажити, оформити та опублікувати
          власноруч проіндексовані табличні архівні дані.
        </p>
        <p className={styles.description}>
          Ваші дані будуть збережені у вигляді PR на GitHub, де їх перевірить
          команда <Link href="/about">Коренів</Link>. А потім вони потраплять на
          сайт і стануть доступні для пошуку.
        </p>
        <p className={styles.description}>
          <strong>Важливо!</strong> Наразі <Link href="/about">Корені</Link>{' '}
          приймають лише таблиці в форматі CSV. Скористайтеся функцією експорту
          в Excel або Google Spreadsheets. <em>Зверніть увагу</em>: експорт CSV
          спрацьовує лише щодо одного аркуша Excel за раз.
        </p>
        <p className={styles.description}>
          <strong>Важливо!</strong> <Link href="/about">Корені</Link> не
          приймають таблиці, які проіндексував невідомо хто. Якщо не хочете
          вписувати справжнє ім&apos;я – просто вигадайте псевдонім. І – будь
          ласка, впишіть якусь адресу електронної пошти, аби з Вами можна було
          зв&apos;язатися.
        </p>
        {isSubmitting && (
          <p className={styles.stageMessage} role="status">
            {STAGE_LABELS[stage]}
          </p>
        )}
      </div>
      <FormProvider {...form}>
        <KnownLocationsContext.Provider value={knownLocations}>
          <ContributeFormStepper />
        </KnownLocationsContext.Provider>
      </FormProvider>{' '}
      {!contributionState.prUrl && (
        <Turnstile
          onVerify={setTurnstileToken}
          refreshExpired="auto"
          sitekey={environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      )}
    </form>
  );
}
