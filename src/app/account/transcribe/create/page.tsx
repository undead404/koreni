'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { notFound, useRouter } from 'next/navigation';
import { SubmitEvent } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import SourcesInput from '@/app/components/contribute/sources-input';
import { SpatialInput } from '@/app/components/contribute/spatial-input';
import YearsInput from '@/app/components/contribute/years-input';
import environment from '@/app/environment';
import requestApi from '@/app/services/api';
import {
  type ProjectCreatePayload,
  projectCreatePayloadSchema,
} from '@/server/src/schemata';

import styles from './page.module.css';

export default function ProjectCreatePage() {
  if (!environment.NEXT_PUBLIC_ENABLE_TRANSCRIBE) {
    notFound();
  }

  const router = useRouter();

  const methods = useForm<ProjectCreatePayload>({
    resolver: zodResolver(projectCreatePayloadSchema),
    defaultValues: {
      id: '',
      isHandwritten: true,
      location: [],
      sources: [],
      tableLocale: undefined,
      title: '',
      type: 'metric-books',
      yearsRange: [],
    },
  });

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = methods;

  const onSubmit = async (data: ProjectCreatePayload) => {
    try {
      await requestApi('/api/transcribe/projects', {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      toast.success('Project created successfully');
      router.push('/account/transcribe');
    } catch {
      toast.error('Failed to create project');
    }
  };

  const handleFormSubmit = (event: SubmitEvent) => {
    void handleSubmit(onSubmit)(event);
  };

  return (
    <main className={styles.root}>
      <h1>Create New Project</h1>

      <FormProvider {...methods}>
        <form className={styles.form} onSubmit={handleFormSubmit}>
          <div>
            <label className={styles.label} htmlFor="title">
              Title
            </label>
            <input
              className={styles.input}
              id="title"
              type="text"
              {...register('title')}
            />
            {errors.title && (
              <p className={styles.error}>{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className={styles.label} htmlFor="id">
              ID (unique)
            </label>
            <input
              className={styles.input}
              id="id"
              type="text"
              {...register('id')}
            />
            {errors.id && <p className={styles.error}>{errors.id.message}</p>}
          </div>

          <div>
            <label className={styles.label} htmlFor="isHandwritten">
              Type
            </label>
            <select
              className={styles.input}
              id="isHandwritten"
              {...register('isHandwritten', {
                setValueAs: (v) => v === 'true',
              })}
            >
              <option value="true">Handwritten</option>
              <option value="false">Typed</option>
            </select>
            {errors.isHandwritten && (
              <p className={styles.error}>{errors.isHandwritten.message}</p>
            )}
          </div>

          <div>
            <label className={styles.label} htmlFor="tableLocale">
              Table Locale
            </label>
            <select
              className={styles.input}
              id="tableLocale"
              {...register('tableLocale')}
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

          <div>
            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <SpatialInput
                  onChange={(value) => {
                    if (!value) {
                      field.onChange();
                      return;
                    }
                    const [lat, lng] = value.split(',').map(Number);
                    field.onChange([lat, lng]);
                  }}
                  value={field.value.join(',') || ''}
                />
              )}
            />
            {errors.location && (
              <p className={styles.error}>{errors.location.message}</p>
            )}
          </div>

          <div>
            <Controller
              control={control}
              name="yearsRange"
              render={({ field }) => <YearsInput {...field} />}
            />
            {errors.yearsRange && (
              <p className={styles.error}>{errors.yearsRange.message}</p>
            )}
          </div>

          <div>
            <SourcesInput />
          </div>

          <button
            className={styles.submitButton}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </FormProvider>
    </main>
  );
}
