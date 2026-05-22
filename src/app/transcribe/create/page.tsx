'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { SubmitEvent } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import SourcesInput from '@/app/components/contribute/sources-input';
import { SpatialInput } from '@/app/components/contribute/spatial-input';
import YearsInput from '@/app/components/contribute/years-input';
import {
  type ProjectCreatePayload,
  projectCreatePayloadSchema,
} from '@/server/src/schemata';

import requestApi from '../services/api';
import styles from './page.module.css';

export default function ProjectCreatePage() {
  const router = useRouter();

  const methods = useForm<ProjectCreatePayload>({
    resolver: zodResolver(projectCreatePayloadSchema),
    defaultValues: {
      id: '',
      title: '',
      isHandwritten: true,
      location: [],
      sources: [],
      tableLocale: undefined,
      yearsRange: [],
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
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
      router.push('/transcribe');
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
        <form onSubmit={handleFormSubmit} className={styles.form}>
          <div>
            <label htmlFor="title" className={styles.label}>
              Title
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={styles.input}
            />
            {errors.title && (
              <p className={styles.error}>{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="id" className={styles.label}>
              ID (unique)
            </label>
            <input
              id="id"
              type="text"
              {...register('id')}
              className={styles.input}
            />
            {errors.id && <p className={styles.error}>{errors.id.message}</p>}
          </div>

          <div>
            <label htmlFor="isHandwritten" className={styles.label}>
              Type
            </label>
            <select
              id="isHandwritten"
              className={styles.input}
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
            <label htmlFor="tableLocale" className={styles.label}>
              Table Locale
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

          <div>
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

          <div>
            <Controller
              name="yearsRange"
              control={control}
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
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </FormProvider>
    </main>
  );
}
