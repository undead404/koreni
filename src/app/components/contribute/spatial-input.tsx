'use client';

import { Loader2, MapPin, Search, X } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import {
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useKnownLocations } from './known-locations-context';
import LocationPicker from './location-picker';
import type { Location } from './types';
import { useLocationSearch } from './use-location-search';

import styles from './context-form.module.css';

const ORIGIN_TITLES = {
  local: 'Наявна таблиця',
  remote: 'Географія',
};

export const SpatialInput = memo(function SpatialInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const searchReference = useRef<HTMLDivElement>(null);
  const knownLocations = useKnownLocations();

  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const { query, setQuery, results, isLoading } =
    useLocationSearch(knownLocations);

  useEffect(() => {
    if (value && !query) {
      setQuery('Вручну обрані координати');
    } else if (!value && query === 'Вручну обрані координати') {
      setQuery('');
    }
  }, [value, query, setQuery]);
  const posthog = usePostHog();

  const handleLocationSelect = useCallback(
    (loc: Location) => {
      posthog.capture('location_selected', {
        location: loc.title,
        coordinates: loc.coordinates.join(','),
      });
      onChange(loc.coordinates.join(','));
      setQuery(loc.title);
      setShowDropdown(false);
      setFocusedIndex(-1);
    },
    [onChange, posthog, setQuery],
  );

  const clearLocation = useCallback(() => {
    onChange('');
    setQuery('');
  }, [onChange, setQuery]);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchReference.current &&
        !searchReference.current.contains(event.target as Node)
      ) {
        posthog.capture('location_search_closed');
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [posthog]);

  return (
    <div className={styles.rows}>
      <div className={styles.colLeft}>
        <div className={styles.fieldGroup} ref={searchReference}>
          <label className={styles.label} htmlFor="location-search">
            Пошук координат
          </label>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              {isLoading ? (
                <Loader2 size={13} strokeWidth={2} className={styles.spinner} />
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
                if (value) onChange('');
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {showDropdown && !value && results.length > 0 && (
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
                    <span className={styles.dropdownItemName}>{loc.title}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {value && (
            <div className={styles.selectedLocation}>
              <span className={styles.selectedLocationIcon} title="Координати">
                <MapPin size={14} strokeWidth={2.5} />
              </span>
              <span className={styles.selectedLocationCoords}>{value}</span>
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
      </div>

      <div className={styles.colRight}>
        <p className={styles.label}>Також можна перетягнути маркер на мапі</p>
        <div className={styles.mapContainer}>
          <div className={styles.mapGrid} />
          <LocationPicker
            value={value}
            onChange={(newValue) => {
              onChange(newValue);
              setQuery('Вручну обрані координати');
            }}
          />
        </div>
      </div>
    </div>
  );
});
