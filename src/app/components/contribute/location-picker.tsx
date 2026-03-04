'use client';

import type { Marker as LMarker } from 'leaflet';
import posthog from 'posthog-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { z } from 'zod';

import { filledIcon } from '@/app/map-icons';
import { initBugsnag } from '@/app/services/bugsnag';
import { autocomplete } from '@/app/services/locationiq';

import MapUpdater from './map-updater';
import type { ContributeFormValues } from './types';

import 'leaflet/dist/leaflet.css';
import styles from './location-picker.module.css';

type Suggestion = {
  coordinates: [number, number];
  title: string;
  source: 'local' | 'locationiq';
};

interface LocationPickerProperties {
  knownLocations: {
    coordinates: [number, number];
    title: string;
  }[];
}

const SOURCE_TRANSLATION = {
  local: 'Наявна таблиця',
  locationiq: 'Географія',
} as const;

const coordinatesStringAsTupleSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
  .transform((value) => {
    const [latString, longString] = value.split(',').map((s) => s.trim());
    const result = [
      Number.parseFloat(latString),
      Number.parseFloat(longString),
    ] as [number, number];
    if (Number.isNaN(result[0]) || Number.isNaN(result[1])) {
      throw new TypeError('Invalid coordinates');
    }
    return result;
  })
  .optional();

const ContributeFormController = Controller as typeof Controller<
  ContributeFormValues,
  'location'
>;

export default function LocationPicker({
  knownLocations,
}: LocationPickerProperties) {
  const { control, setValue } = useFormContext<ContributeFormValues>();

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const markerReference = useRef<LMarker>(null);
  const hasFoundReference = useRef(false);
  const location = useWatch({ control, name: 'location' });

  useEffect(() => {
    if (!location) {
      setInputValue('');
      setSuggestions([]);
      setIsDropdownOpen(false);
    }
  }, [location]);

  const search = useCallback(async () => {
    posthog.capture('contribution_search_location', {
      query: inputValue,
    });
    // 1. Пошук у локальному масиві
    const localResults: Suggestion[] = knownLocations
      .filter((item) =>
        item.title.toLowerCase().includes(inputValue.toLowerCase()),
      )
      .map((item) => ({ ...item, source: 'local' }));

    // 2. Пошук через LocationIQ Autocomplete
    try {
      const response = await autocomplete(inputValue);
      if (!response) throw new Error('LocationIQ fetch failed');

      const remoteResults: Suggestion[] = response.map((item) => ({
        coordinates: [item.lat, item.lon],
        title: item.display_name,
        source: 'locationiq',
      }));

      setSuggestions([...localResults, ...remoteResults]);
      setIsDropdownOpen(true);
    } catch (error) {
      console.error(error);
      posthog.capture('contribution_location_search_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      initBugsnag().notify(error as Error);
      // Fallback до локальних даних при помилці API
      setSuggestions(localResults);
      setIsDropdownOpen(true);
    }
  }, [inputValue, knownLocations]);

  // Дебаунс та пошук
  useEffect(() => {
    if (hasFoundReference.current) return;
    if (inputValue.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      void search();
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, search]);

  const handleSelect = useCallback(
    (suggestion: Suggestion) => {
      posthog.capture('contribution_select_location', {
        source: suggestion.source,
        title: suggestion.title,
      });
      const coords = suggestion.coordinates;
      hasFoundReference.current = true;
      setIsDropdownOpen(false);
      setInputValue(suggestion.title);
      setMapCenter(coords);
      setValue('location', coords.join(','), {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue],
  );

  return (
    <ContributeFormController
      control={control}
      name="location"
      render={({ field }) => (
        <div className={styles.container}>
          <div className={styles.inputWrapper}>
            <p className={styles.label}>
              Координати: {field.value || 'Не вказано'}
            </p>
            <input
              type="text"
              className={styles.input}
              placeholder="Пошук місця..."
              value={inputValue}
              onKeyDown={() => {
                hasFoundReference.current = false;
              }}
              onChange={(event) => {
                setInputValue(event.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
            />

            {isDropdownOpen && suggestions.length > 0 && (
              <ul className={styles.suggestionsList}>
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      className={styles.suggestionItem}
                      onClick={() => handleSelect(suggestion)}
                      type="button"
                    >
                      <span className={styles.sourceBadge}>
                        [{SOURCE_TRANSLATION[suggestion.source]}]
                      </span>
                      {suggestion.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.mapContainer}>
            <MapContainer
              center={
                coordinatesStringAsTupleSchema.safeParse(field.value)?.data || [
                  48.3794, 31.1656,
                ]
              } // Дефолт: центр України
              zoom={field.value ? 13 : 5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater center={mapCenter} />

              {field.value &&
                coordinatesStringAsTupleSchema.safeParse(field.value)
                  .success && (
                  <Marker
                    icon={filledIcon}
                    position={
                      coordinatesStringAsTupleSchema.safeParse(field.value)
                        .data!
                    }
                    draggable={true}
                    ref={markerReference}
                    eventHandlers={{
                      dragend: () => {
                        const marker = markerReference.current;
                        if (marker) {
                          const newPos = marker.getLatLng();
                          const newCoords = [newPos.lat, newPos.lng] as [
                            number,
                            number,
                          ];
                          setValue('location', newCoords.join(','), {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          setMapCenter(newCoords);
                        }
                      },
                    }}
                  />
                )}
            </MapContainer>
          </div>
        </div>
      )}
    />
  );
}
