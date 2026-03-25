'use client';

import { ErrorMessage } from '@hookform/error-message';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import slugifyUkrainian from '@/app/helpers/slugify-ukrainian';

import ArchiveItemsInput from './archive-items-input';
import { useKnownLocations } from './known-locations-context';
import LocationPicker from './location-picker';
import SourcesInput from './sources-input';
import { useTableStateStore } from './table-state';
import type { ContributeForm2Values, Location } from './types';
import { useLocationSearch } from './use-location-search';
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
  const searchReference = useRef<HTMLDivElement>(null);
  const knownLocations = useKnownLocations();
  const { tableFileName } = useTableStateStore();
  const {
    control,
    formState: { errors, touchedFields, dirtyFields },
    register,
    setValue,
  } = useFormContext<ContributeForm2Values>();

  const archiveItems = useWatch({ control, name: 'archiveItems' });
  const titleValue = useWatch({ control, name: 'title' });
  const locationValue = useWatch({ control, name: 'location' });
  const yearsRange = useWatch({ control, name: 'yearsRange' });

  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const { query, setQuery, results, isLoading } =
    useLocationSearch(knownLocations);

  useEffect(() => {
    if (!touchedFields.title && !dirtyFields.title) {
      setValue('title', tableFileName.split('.')[0]);
    }
  }, [setValue, tableFileName, touchedFields.title, dirtyFields.title]);

  // Handle title to slug mapping
  useEffect(() => {
    if (titleValue && !touchedFields.id && !dirtyFields.id) {
      setValue('id', slugifyUkrainian(titleValue));
    }
  }, [setValue, titleValue, touchedFields.id, dirtyFields.id]);

  const handleLocationSelect = useCallback(
    (loc: Location) => {
      setValue('location', loc.coordinates.join(','), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setQuery(loc.title);
      setShowDropdown(false);
      setFocusedIndex(-1);
    },
    [setValue, setQuery],
  );

  const clearLocation = useCallback(() => {
    setValue('location', '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setQuery('');
  }, [setValue, setQuery]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!showDropdown) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex((previous) =>
        previous < results.length - 1 ? previous + 1 : previous,
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((previous) => (previous > 0 ? previous - 1 : -1));
    } else if (event.key === 'Enter' && focusedIndex >= 0) {
      event.preventDefault();
      handleLocationSelect(results[focusedIndex]);
    } else if (event.key === 'Escape') {
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
  };

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
            <div className={styles.rows}>
              <div className={styles.colLeft}>
                <div className={styles.fieldGroup} ref={searchReference}>
                  <label className={styles.label} htmlFor="location-search">
                    Пошук координат
                  </label>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>
                      {isLoading ? (
                        <Loader2
                          size={13}
                          strokeWidth={2}
                          className={styles.spinner}
                        />
                      ) : (
                        <Search size={13} strokeWidth={2} />
                      )}
                    </span>
                    <input
                      id="location-search"
                      type="text"
                      className={styles.searchInput}
                      placeholder="Локація для пошуку..."
                      value={query}
                      role="combobox"
                      aria-expanded={showDropdown}
                      aria-autocomplete="list"
                      aria-controls="location-listbox"
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setShowDropdown(true);
                        setFocusedIndex(-1);
                        if (field.value) setValue('location', '');
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>

                  {showDropdown && !locationValue && results.length > 0 && (
                    <div
                      className={styles.dropdown}
                      role="listbox"
                      id="location-listbox"
                    >
                      {results.map((loc, index) => (
                        <button
                          key={loc.coordinates.join(',') + loc.title}
                          type="button"
                          role="option"
                          aria-selected={index === focusedIndex}
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

                  {locationValue && (
                    <div className={styles.selectedLocation}>
                      <span
                        className={styles.selectedLocationIcon}
                        title="Координати"
                      >
                        <MapPin size={14} strokeWidth={2.5} />
                      </span>
                      <span className={styles.selectedLocationCoords}>
                        {field.value}
                      </span>
                      <input type="hidden" {...field} />
                      <button
                        type="button"
                        className={styles.selectedLocationClear}
                        onClick={clearLocation}
                        aria-label="Clear selected location"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
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
                  <LocationPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
