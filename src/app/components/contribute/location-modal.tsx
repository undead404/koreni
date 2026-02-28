import { useCallback, useEffect, useState } from 'react';

import styles from './contribute-form.module.css';
import ownStyles from './location-modal.module.css';
interface LocationModalProperties {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (coordinates: [number, number]) => void;
  knownLocations: {
    coordinates: [number, number];
    title: string;
  }[];
}

export default function LocationModal({
  isOpen,
  onClose,
  onSelect,
  knownLocations,
}: LocationModalProperties) {
  const [locationSearch, setLocationSearch] = useState('');

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className={ownStyles.wrapper} onClick={onClose}>
      <div
        className={ownStyles.innerWrapper}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>Запозичити місце в іншої таблиці</h3>
        <input
          autoFocus
          type="text"
          placeholder="Введіть назву населеного пункту..."
          className={styles.input}
          value={locationSearch}
          onChange={(event) => setLocationSearch(event.target.value)}
        />
        <div className={ownStyles.list}>
          {knownLocations
            .filter((loc) =>
              loc.title.toLowerCase().includes(locationSearch.toLowerCase()),
            )
            .slice(0, 50)
            .map((loc) => (
              <button
                key={loc.title}
                className={ownStyles.listItem}
                onClick={() => onSelect(loc.coordinates)}
              >
                {loc.title}
              </button>
            ))}
        </div>
        <button type="button" className={styles.button} onClick={onClose}>
          Закрити
        </button>
      </div>
    </div>
  );
}
