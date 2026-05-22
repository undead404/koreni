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
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Create New Project</h1>

      <FormProvider {...methods}>
        <form
          onSubmit={handleFormSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div>
            <label
              htmlFor="title"
              style={{ display: 'block', marginBottom: '0.5rem' }}
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              style={{ width: '100%', padding: '0.5rem' }}
            />
            {errors.title && (
              <p style={{ color: 'red' }}>{errors.title.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="id"
              style={{ display: 'block', marginBottom: '0.5rem' }}
            >
              ID (unique)
            </label>
            <input
              id="id"
              type="text"
              {...register('id')}
              style={{ width: '100%', padding: '0.5rem' }}
            />
            {errors.id && <p style={{ color: 'red' }}>{errors.id.message}</p>}
          </div>

          <div>
            <label
              htmlFor="isHandwritten"
              style={{ display: 'block', marginBottom: '0.5rem' }}
            >
              Type
            </label>
            <select
              id="isHandwritten"
              style={{ width: '100%', padding: '0.5rem' }}
              {...register('isHandwritten', {
                setValueAs: (v) => v === 'true',
              })}
            >
              <option value="true">Handwritten</option>
              <option value="false">Typed</option>
            </select>
            {errors.isHandwritten && (
              <p style={{ color: 'red' }}>{errors.isHandwritten.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="tableLocale"
              style={{ display: 'block', marginBottom: '0.5rem' }}
            >
              Table Locale
            </label>
            <select
              id="tableLocale"
              {...register('tableLocale')}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">Select locale...</option>
              <option value="uk">Ukrainian (uk)</option>
              <option value="pl">Polish (pl)</option>
              <option value="ru">Russian (ru)</option>
            </select>
            {errors.tableLocale && (
              <p style={{ color: 'red' }}>{errors.tableLocale.message}</p>
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
              <p style={{ color: 'red' }}>{errors.location.message}</p>
            )}
          </div>

          <div>
            <Controller
              name="yearsRange"
              control={control}
              render={({ field }) => <YearsInput {...field} />}
            />
            {errors.yearsRange && (
              <p style={{ color: 'red' }}>{errors.yearsRange.message}</p>
            )}
          </div>

          <div>
            <SourcesInput />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </FormProvider>
    </main>
  );
}
