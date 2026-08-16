'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { SubmitEvent, useEffect, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { KnownLocationsContext } from '@/app/components/contribute/known-locations-context';
import SourcesInput from '@/app/components/contribute/sources-input';
import type { Location } from '@/app/components/contribute/types';
import YearsInput from '@/app/components/contribute/years-input';
import {
  type ProjectCreatePayload,
  projectCreatePayloadSchema,
} from '@/server/src/schemata';

import createProject from '../api/create-project';
import getProjectSchemas from '../api/get-project-schemas';

import styles from './page.module.css';

const SpatialInput = dynamic(
  () =>
    import('@/app/components/contribute/spatial-input').then(
      (module_) => module_.SpatialInput,
    ),
  { ssr: false },
);

interface CreatePageContentProperties {
  knownLocations: Location[];
}

export default function CreatePageContent({
  knownLocations,
}: CreatePageContentProperties) {
  const router = useRouter();
  const [schemas, setSchemas] = useState<
    { enabled: boolean; label: string; value: string }[]
  >([]);

  useEffect(() => {
    let active = true;
    const loadSchemas = async () => {
      try {
        const data = await getProjectSchemas();
        if (active) {
          setSchemas(data);
        }
      } catch {
        void 0; /* error removed */
      }
    };
    void loadSchemas();
    return () => {
      active = false;
    };
  }, []);

  const methods = useForm<ProjectCreatePayload>({
    resolver: zodResolver(projectCreatePayloadSchema),
    defaultValues: {
      type: '' as unknown as ProjectCreatePayload['type'],
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
      await createProject(data);

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
            {errors.type && (
              <p className={styles.error}>{errors.type.message}</p>
            )}
            <div className={styles.schemaLinkContainer}>
              <span className={styles.disabledLink}>
                Create new project type
              </span>
              <span className={styles.note}>
                {' '}
                (Project type creation is not yet implemented)
              </span>
            </div>
          </div>

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
              Handwritten
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
          </KnownLocationsContext.Provider>

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
