'use client';

import { MapPin, MapPinned, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './context-form.module.css';

/* ────────────────────────────────────────── */
/*  Mock data                                  */
/* ────────────────────────────────────────── */

interface LocationResult {
  name: string;
  sub: string;
  lat: string;
  lng: string;
}

const MOCK_LOCATIONS: LocationResult[] = [
  {
    name: 'Lake Titicaca',
    sub: 'Puno, Peru / Bolivia',
    lat: '-15.8402',
    lng: '-69.3343',
  },
  {
    name: 'Lake Victoria',
    sub: 'Uganda / Kenya / Tanzania',
    lat: '-1.2833',
    lng: '32.8500',
  },
  {
    name: 'Lake Baikal',
    sub: 'Siberia, Russia',
    lat: '53.5587',
    lng: '108.1650',
  },
];

const INITIAL_TAGS = ['ДАОО-37-3-102', 'ДАОО-37-3-103'];

/* ────────────────────────────────────────── */
/*  Component                                  */
/* ────────────────────────────────────────── */

export default function ContextForm() {
  /* ── Location search ── */
  const [locationQuery, setLocationQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(null);
  const searchReference = useRef<HTMLDivElement>(null);

  const filteredLocations =
    locationQuery.length > 0
      ? MOCK_LOCATIONS.filter(
          (l) =>
            l.name.toLowerCase().includes(locationQuery.toLowerCase()) ||
            l.sub.toLowerCase().includes(locationQuery.toLowerCase()),
        )
      : MOCK_LOCATIONS;

  const handleLocationSelect = useCallback((loc: LocationResult) => {
    setSelectedLocation(loc);
    setLocationQuery(loc.name);
    setShowDropdown(false);
  }, []);

  const clearLocation = useCallback(() => {
    setSelectedLocation(null);
    setLocationQuery('');
  }, []);

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

  /* ── Tags ── */
  const [tags, setTags] = useState<string[]>(INITIAL_TAGS);
  const [tagInput, setTagInput] = useState('');
  const tagInputReference = useRef<HTMLInputElement>(null);

  const addTag = useCallback(
    (value: string) => {
      const trimmed = value.trim().toLowerCase();
      if (trimmed && !tags.includes(trimmed)) {
        setTags((previous) => [...previous, trimmed]);
      }
      setTagInput('');
    },
    [tags],
  );

  const removeTag = useCallback((tag: string) => {
    setTags((previous) => previous.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addTag(tagInput);
      } else if (
        event.key === 'Backspace' &&
        tagInput === '' &&
        tags.length > 0
      ) {
        removeTag(tags.at(-1)!);
      }
    },
    [tagInput, tags, addTag, removeTag],
  );

  /* ── Year ── */
  const [yearRange, setYearRange] = useState('2018 – 2024');

  /* ── Generated fields ── */
  const generatedId = 'DS-2026-00483-LAKE';
  const generatedTitle = selectedLocation
    ? `${selectedLocation.name} Dataset — ${tags.slice(0, 2).join(', ') || 'untagged'}`
    : 'Untitled Dataset — awaiting location';

  return (
    <div className={styles.wrapper}>
      {/* ── Generated (read-only) fields ── */}
      <div className={styles.generatedRow}>
        <div className={styles.generatedField}>
          <label className={styles.label} htmlFor="id-input">
            Ідентифікатор
          </label>
          <input
            id="id-input"
            type="text"
            className={styles.readonlyInput}
            value={generatedId}
            readOnly
            disabled
            tabIndex={-1}
          />
        </div>
        <div className={styles.generatedField}>
          <label className={styles.label} htmlFor="title-input">
            Назва
          </label>
          <input
            id="title-input"
            type="text"
            className={styles.readonlyInput}
            value={generatedTitle}
            readOnly
            disabled
            tabIndex={-1}
          />
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Two-column body ── */}
      <div className={styles.columns}>
        {/* Left column: form fields */}
        <div className={styles.colLeft}>
          {/* Location search */}
          <div className={styles.fieldGroup} ref={searchReference}>
            <label className={styles.label} htmlFor="location-search">
              Location Search
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
                  if (selectedLocation) setSelectedLocation(null);
                }}
                onFocus={() => setShowDropdown(true)}
              />
            </div>

            {/* Autocomplete dropdown */}
            {showDropdown && !selectedLocation && (
              <div className={styles.dropdown}>
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handleLocationSelect(loc)}
                  >
                    <span className={styles.dropdownItemIcon}>
                      <MapPin size={14} strokeWidth={2} />
                    </span>
                    <span className={styles.dropdownItemText}>
                      <span className={styles.dropdownItemName}>
                        {loc.name}
                      </span>
                      <span className={styles.dropdownItemSub}>{loc.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected location chip */}
            {selectedLocation && (
              <div className={styles.selectedLocation}>
                <span className={styles.selectedLocationIcon}>
                  <MapPin size={12} strokeWidth={2.5} />
                </span>
                <span className={styles.selectedLocationText}>
                  {selectedLocation.name}
                </span>
                <span className={styles.selectedLocationCoords}>
                  {selectedLocation.lat}, {selectedLocation.lng}
                </span>
                <button
                  type="button"
                  className={styles.selectedLocationClear}
                  onClick={clearLocation}
                  aria-label="Clear selected location"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* Archive codes (tags) */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="next-archive-item-input">
              Шифри архівних справ
            </label>
            <div className={styles.tagsWrap}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    className={styles.tagRemove}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeTag(tag);
                    }}
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputReference}
                id="next-archive-item-input"
                type="text"
                className={styles.tagInput}
                placeholder={
                  tags.length === 0 ? 'Введіть і натисніть Enter...' : ''
                }
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) addTag(tagInput);
                }}
              />
            </div>
          </div>

          {/* Year / range */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="year-input">
              Рік або діапазон років через дефіс
            </label>
            <input
              id="year-input"
              type="text"
              className={styles.input}
              placeholder="наприклад, 2020, або 2018 – 2024"
              value={yearRange}
              onChange={(event) => setYearRange(event.target.value)}
            />
          </div>
        </div>

        {/* Right column: map placeholder */}
        <div className={styles.colRight}>
          <p className={styles.label}>Попередній вигляд на мапі</p>
          <div className={styles.mapContainer}>
            <div className={styles.mapGrid} />
            {selectedLocation ? (
              <>
                <div className={styles.mapPin}>
                  <div className={styles.mapPinDot} />
                  <div className={styles.mapPinRing} />
                </div>
                <span className={styles.mapLabel}>
                  {selectedLocation.name}
                  <br />
                  {selectedLocation.lat}, {selectedLocation.lng}
                </span>
              </>
            ) : (
              <>
                <MapPinned size={20} strokeWidth={1.5} color="#94a3b8" />
                <span className={styles.mapLabel}>
                  Оберіть локацію для попереднього перегляду
                  <br />
                  Віджет мапи Leaflet
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
