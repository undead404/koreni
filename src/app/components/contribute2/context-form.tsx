'use client';

import { ErrorMessage } from '@hookform/error-message';
import { MapPin, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import slugifyUkrainian from '@/app/helpers/slugify-ukrainian';
import { autocomplete } from '@/app/services/locationiq';

import ArchiveItemsInput from './archive-items-input';
import { useKnownLocations } from './known-locations-context';
import LocationPicker from './location-picker';
import SourcesInput from './sources-input';
import { useTableStateStore } from './table-state';
import type { ContributeForm2Values, Location } from './types';
import YearsInput from './years-input';

import styles from './context-form.module.css';

const LocationController = Controller as typeof Controller<
  ContributeForm2Values,
  'location'
>;

const ORIGIN_TITLES = {
  local: 'Наявна таблиця',
  remote: 'Географія',
};

/* ────────────────────────────────────────── */
/*  Component                                  */
/* ────────────────────────────────────────── */
export default function ContextForm() {
  /* ── Location search ── */
  const [locationQuery, setLocationQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchReference = useRef<HTMLDivElement>(null);
  const knownLocations = useKnownLocations();
  const { tableFileName } = useTableStateStore();
  const {
    control,
    formState: { errors, touchedFields },
    register,
    setValue,
  } = useFormContext<ContributeForm2Values>();
  const archiveItems = useWatch({ control, name: 'archiveItems' });

  const titleValue = useWatch({ control, name: 'title' });
  const locationValue = useWatch({ control, name: 'location' });

  useEffect(() => {
    if (!touchedFields.title) {
      setValue('title', tableFileName.split('.')[0]);
    }
  }, [setValue, tableFileName, touchedFields.title]);
  // Handle title to slug mapping
  useEffect(() => {
    if (titleValue && !touchedFields.id) {
      setValue('id', slugifyUkrainian(titleValue));
    }
  }, [setValue, titleValue, touchedFields.id]);

  const [filteredLocations, setFilteredLocations] = useState<
    (Location & { origin: 'local' | 'remote' })[]
  >([]);

  const [runSearch, cleanupSearch] = useMemo(() => {
    const abortController = new AbortController();
    let timeout: ReturnType<typeof setTimeout>;
    let debounceTimeout: ReturnType<typeof setTimeout>;
    function run() {
      if (!locationQuery) {
        setFilteredLocations(
          knownLocations.slice(0, 10).map((l) => ({ ...l, origin: 'local' })),
        );
        return;
      }
      const localLocations = knownLocations
        .filter(
          (l) =>
            l.title.toLowerCase().includes(locationQuery.toLowerCase()) ||
            l.title.toLowerCase().includes(locationQuery.toLowerCase()),
        )
        .map((l) => ({ ...l, origin: 'local' as const }));
      setFilteredLocations(localLocations);

      debounceTimeout = setTimeout(() => {
        timeout = setTimeout(() => {
          abortController.abort('timeout');
        }, 5000);

        // eslint-disable-next-line promise/catch-or-return
        autocomplete(locationQuery, abortController)
          .then((data) => {
            if (abortController.signal.aborted) {
              return;
            }
            // eslint-disable-next-line promise/always-return
            if (!data) {
              return;
            }
            setFilteredLocations([
              ...localLocations,
              ...data.map((l) => ({
                coordinates: [l.lat, l.lon] as [number, number],
                title: l.display_name,
                origin: 'remote' as const,
              })),
            ]);
          })
          .catch((error) => {
            if (abortController.signal.aborted) {
              return;
            }
            console.error(error);
            setFilteredLocations(
              knownLocations
                .filter(
                  (l) =>
                    l.title
                      .toLowerCase()
                      .includes(locationQuery.toLowerCase()) ||
                    l.title.toLowerCase().includes(locationQuery.toLowerCase()),
                )
                .map((l) => ({ ...l, origin: 'local' })),
            );
          })
          .finally(() => {
            clearTimeout(timeout);
          });
      }, 1000);
    }
    function cleanup() {
      abortController.abort('unmount');
      clearTimeout(timeout);
      clearTimeout(debounceTimeout);
    }
    return [run, cleanup];
  }, [knownLocations, locationQuery]);

  useEffect(() => {
    runSearch();
    return cleanupSearch;
  }, [cleanupSearch, runSearch]);

  const handleLocationSelect = useCallback(
    (loc: Location) => {
      setValue('location', loc.coordinates.join(','), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setLocationQuery(loc.title);
      setShowDropdown(false);
    },
    [setValue],
  );

  const clearLocation = useCallback(() => {
    setValue('location', '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setLocationQuery('');
  }, [setValue]);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchReference.current &&
        !searchReference.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const yearsRange = useWatch({ control, name: 'yearsRange' });

  return (
    <div className={styles.wrapper}>
      <div className={styles.generatedRow}>
        <div className={styles.generatedField}>
          <div className={styles.generatedField}>
            <label className={styles.label} htmlFor="title-input">
              Назва
            </label>
            <input
              id="title-input"
              className={styles.input}
              type="text"
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
            />
          </div>
          <label className={styles.label} htmlFor="id-input">
            Ідентифікатор
          </label>
          <input
            id="id-input"
            type="text"
            className={styles.input}
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
          />
        </div>
      </div>

      <div className={styles.divider} />

      {/* Archive codes */}
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

      {/* Year / range */}
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

      <LocationController
        control={control}
        name="location"
        render={({ field }) => (
          <div className={styles.rows}>
            {/* Left column: form fields */}
            <div className={styles.colLeft}>
              {/* Location search */}
              <div className={styles.fieldGroup} ref={searchReference}>
                <label className={styles.label} htmlFor="location-search">
                  Пошук координат
                </label>
                <div className={styles.searchWrap}>
                  <span className={styles.searchIcon}>
                    <Search size={13} strokeWidth={2} />
                  </span>
                  <input
                    id="location-search"
                    type="text"
                    className={styles.searchInput}
                    placeholder="Локація для пошуку..."
                    value={locationQuery}
                    onChange={(event) => {
                      setLocationQuery(event.target.value);
                      setShowDropdown(true);
                      if (field.value) setValue('location', '');
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                </div>

                {/* Autocomplete dropdown */}
                {showDropdown && !locationValue && (
                  <div className={styles.dropdown}>
                    {filteredLocations.map((loc) => (
                      <button
                        key={loc.coordinates.join(',') + loc.title}
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => handleLocationSelect(loc)}
                        title={loc.title}
                      >
                        <span className={styles.dropdownItemIcon}>
                          <MapPin size={14} strokeWidth={2} />
                        </span>
                        <span className={styles.dropdownItemOrigin}>
                          [{ORIGIN_TITLES[loc.origin]}]
                        </span>
                        <span className={styles.dropdownItemText}>
                          <span className={styles.dropdownItemName}>
                            {loc.title}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected location chip */}
                {
                  <label
                    htmlFor="location-coordinates-input"
                    className={styles.selectedLocation}
                  >
                    <span
                      className={styles.selectedLocationIcon}
                      title="Координати"
                    >
                      <MapPin size={12} strokeWidth={2.5} />
                    </span>
                    <input
                      className={styles.selectedLocationCoords}
                      id="location-coordinates-input"
                      {...field}
                    />
                    <button
                      type="button"
                      className={styles.selectedLocationClear}
                      onClick={clearLocation}
                      aria-label="Clear selected location"
                    >
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  </label>
                }
              </div>
              <ErrorMessage
                className={styles.error}
                errors={errors}
                name="location"
                as="p"
              />
            </div>

            <div className={styles.colRight}>
              <p className={styles.label}>
                Також можна перетягнути маркер на мапі
              </p>
              <div className={styles.mapContainer}>
                <div className={styles.mapGrid} />
                <LocationPicker value={field.value} onChange={field.onChange} />
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
