'use client';

import { ErrorMessage } from '@hookform/error-message';
import { throttle } from 'lodash';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { reverseGeocode } from '@/app/services/locationiq';

import type { ContributeFormValues } from './types';

import styles from './contribute-form.module.css';
import ownStyles from './location-fields.module.css';

// Динамічний імпорт критичний для react-leaflet у Next.js
const LocationPicker = dynamic(() => import('./location-picker'), {
  ssr: false,
  loading: () => (
    <div className="h-12 w-full animate-pulse bg-gray-200 rounded" />
  ),
});

interface LocationFieldsProperties {
  knownLocations: {
    coordinates: [number, number];
    title: string;
  }[];
}

export default function LocationFields({
  knownLocations,
}: LocationFieldsProperties) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ContributeFormValues>();
  const locationValue = useWatch({ control, name: 'location' });

  const [locationGuess, setLocationGuess] = useState('');

  const handleSelect = useMemo(
    () =>
      throttle((value: string) => {
        const [latString, longString] = value
          .split(',')
          .map((s) => s.trim())
          .map(Number);
        if (Number.isNaN(latString) || Number.isNaN(longString)) {
          setLocationGuess('');
        } else {
          void reverseGeocode([latString, longString]).then((displayName) =>
            setLocationGuess(displayName || ''),
          );
        }
      }, 500),
    [],
  );

  useEffect(() => {
    if (!locationValue) return;

    handleSelect(locationValue);
    return () => handleSelect.cancel();
  }, [handleSelect, locationValue]);
  return (
    <div className={styles.field}>
      <label className={styles.label}>Локація (Пошук або координати)</label>
      <p className={styles.description}>
        Запозичте координати за наявною таблицею (бажано), знайдіть населений
        пункт за назвою або встановіть маркер на мапі
      </p>

      <div className={ownStyles.inputWrapper}>
        {/* Компонент сам містить Controller та керує своїм UI (інпут + мапа) */}
        <LocationPicker knownLocations={knownLocations} />

        <ErrorMessage errors={errors} name="location" />
      </div>
      {locationGuess && (
        <p className={styles.locationGuess}>
          <span className={ownStyles.hint}>Найближче сучасне поселення</span>:{' '}
          {locationGuess}
          {!locationGuess.includes('Україна') && (
            <>
              <br />
              <span className={ownStyles.warning}>
                Обрані координати не відповідають Україні. Ви впевнені, що вони
                коректні?
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
}
