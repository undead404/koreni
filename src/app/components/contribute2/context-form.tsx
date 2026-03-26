'use client';

import { ErrorMessage } from '@hookform/error-message';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import ArchiveItemsInput from './archive-items-input';
import SourcesInput from './sources-input';
import { SpatialInput } from './spatial-input';
import type { ContributeForm2Values } from './types';
import { useFormAutoFill } from './use-form-auto-fill';
import YearsInput from './years-input';

import styles from './context-form.module.css';

const LocationController = Controller as typeof Controller<
  ContributeForm2Values,
  'location'
>;

/* ────────────────────────────────────────── */
/*  Component                                  */
/* ────────────────────────────────────────── */
export default function ContextForm() {
  const {
    control,
    formState: { errors },
    register,
  } = useFormContext<ContributeForm2Values>();

  const archiveItems = useWatch({ control, name: 'archiveItems' });
  const yearsRange = useWatch({ control, name: 'yearsRange' });

  useFormAutoFill();

  return (
    <div className={styles.wrapper}>
      {/* Core Metadata */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Основні дані</h3>
        <div className={styles.generatedRow}>
          <div className={styles.generatedField}>
            <label className={styles.label} htmlFor="title-input">
              Назва
            </label>
            <input
              id="title-input"
              className={styles.input}
              type="text"
              aria-describedby="title-error"
              {...register('title', {
                required: true,
                minLength: 10,
                maxLength: 256,
              })}
            />
            <ErrorMessage
              className={styles.error}
              errors={errors}
              name="title"
              as="p"
              render={({ message }) => (
                <p id="title-error" className={styles.error}>
                  {message}
                </p>
              )}
            />
          </div>
          <div className={styles.generatedField}>
            <label className={styles.label} htmlFor="id-input">
              Ідентифікатор
            </label>
            <input
              id="id-input"
              type="text"
              className={styles.input}
              aria-describedby="id-error"
              {...register('id', {
                required: true,
                pattern: {
                  value: /^[a-z\-0-9]+$/i,
                  message: 'Лише латинські літери, цифри та дефіси',
                },
                minLength: 5,
                maxLength: 128,
              })}
            />
            <ErrorMessage
              className={styles.error}
              errors={errors}
              name="id"
              as="p"
              render={({ message }) => (
                <p id="id-error" className={styles.error}>
                  {message}
                </p>
              )}
            />
          </div>
        </div>
      </div>

      {/* Temporal/Source Data */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Дані та час</h3>
        <div className={styles.fieldGroup}>
          <Controller
            control={control}
            name="archiveItems"
            render={({ field }) => <ArchiveItemsInput {...field} />}
          />
          <ErrorMessage
            className={styles.error}
            errors={errors}
            name="archiveItems"
            as="p"
          />
          {archiveItems.map((archiveItem, index) => (
            <ErrorMessage
              key={archiveItem.item}
              className={styles.error}
              errors={errors}
              name={`archiveItems.${index}.item` as keyof ContributeForm2Values}
              as="p"
            />
          ))}
        </div>

        <div className={styles.fieldGroup}>
          <Controller
            control={control}
            name="yearsRange"
            render={({ field }) => <YearsInput {...field} />}
          />
          <ErrorMessage
            className={styles.error}
            errors={errors}
            name="yearsRange"
            as="p"
          />
          {yearsRange?.map((year, index) => (
            <ErrorMessage
              key={year}
              className={styles.error}
              errors={errors}
              name={`yearsRange.${index}` as keyof ContributeForm2Values}
              as="p"
            />
          )) ?? null}
        </div>
        <div className={styles.fieldGroup}>
          <SourcesInput />
        </div>
      </div>

      {/* Spatial Data */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Просторові дані</h3>
        <LocationController
          control={control}
          name="location"
          render={({ field }) => (
            <>
              <SpatialInput value={field.value} onChange={field.onChange} />
              <ErrorMessage
                className={styles.error}
                errors={errors}
                name="location"
                as="p"
              />
            </>
          )}
        />
      </div>
    </div>
  );
}
