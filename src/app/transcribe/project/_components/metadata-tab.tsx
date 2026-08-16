import dynamic from 'next/dynamic';
import { Controller, useFormContext } from 'react-hook-form';

import { KnownLocationsContext } from '@/app/components/contribute/known-locations-context';
import SourcesInput from '@/app/components/contribute/sources-input';
import YearsInput from '@/app/components/contribute/years-input';
import { ProjectCreatePayload } from '@/server/src/schemata';

import { MetadataTabProperties } from '../types';

import styles from '../page.module.css';

const SpatialInput = dynamic(
  () =>
    import('@/app/components/contribute/spatial-input').then(
      (module_) => module_.SpatialInput,
    ),
  { ssr: false },
);

export default function MetadataTab({
  schemas,
  onSubmit,
  isSubmitting,
  knownLocations,
}: MetadataTabProperties) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProjectCreatePayload>();

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.fieldGroup}>
        <label htmlFor="type" className={styles.label}>
          Project Type
        </label>
        <select id="type" {...register('type')} className={styles.input}>
          <option value="">Select a type...</option>
          {schemas.map((schema) => (
            <option
              key={schema.value}
              value={schema.value}
              disabled={!schema.enabled}
            >
              {schema.label}
            </option>
          ))}
        </select>
        {errors.type && <p className={styles.error}>{errors.type.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="title" className={styles.label}>
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={styles.input}
        />
        {errors.title && <p className={styles.error}>{errors.title.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="id" className={styles.label}>
          ID (unique, read-only)
        </label>
        <input
          id="id"
          type="text"
          {...register('id')}
          disabled
          className={styles.input}
        />
        {errors.id && <p className={styles.error}>{errors.id.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="isHandwritten" className={styles.label}>
          Handwritten
        </label>
        <select
          id="isHandwritten"
          className={styles.input}
          {...register('isHandwritten', {
            setValueAs: (v) => v === 'true' || v === true,
          })}
        >
          <option value="true">Handwritten</option>
          <option value="false">Typed</option>
        </select>
        {errors.isHandwritten && (
          <p className={styles.error}>{errors.isHandwritten.message}</p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="tableLocale" className={styles.label}>
          Document Locale
        </label>
        <select
          id="tableLocale"
          {...register('tableLocale')}
          className={styles.input}
        >
          <option value="">Select locale...</option>
          <option value="uk">Ukrainian (uk)</option>
          <option value="pl">Polish (pl)</option>
          <option value="ru">Russian (ru)</option>
        </select>
        {errors.tableLocale && (
          <p className={styles.error}>{errors.tableLocale.message}</p>
        )}
      </div>

      <KnownLocationsContext.Provider value={knownLocations}>
        <div className={styles.fieldGroup}>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <SpatialInput
                value={field.value.join(',') || ''}
                onChange={(value) => {
                  if (!value) {
                    field.onChange();
                    return;
                  }
                  const [lat, lng] = value.split(',').map(Number);
                  field.onChange([lat, lng]);
                }}
              />
            )}
          />
          {errors.location && (
            <p className={styles.error}>{errors.location.message}</p>
          )}
        </div>
      </KnownLocationsContext.Provider>

      <div className={styles.fieldGroup}>
        <Controller
          name="yearsRange"
          control={control}
          render={({ field }) => <YearsInput {...field} />}
        />
        {errors.yearsRange && (
          <p className={styles.error}>{errors.yearsRange.message}</p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <SourcesInput />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submitButton}
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
