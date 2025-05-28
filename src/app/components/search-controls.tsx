import { type ChangeEvent, type FC, useCallback, useState } from 'react';

import styles from './search-controls.module.css';

interface ControlsProperties {
  initialValue: string;
  onInput: (event: CustomEvent<string>) => void;
}

// This input is responsible only for changing value within itself.
// The only source of change is user input, though it can take initial value
// from query or other source.
const SearchControls: FC<ControlsProperties> = ({ initialValue, onInput }) => {
  const [inputValue, setInputValue] = useState(initialValue);

  const handleInputChange = useCallback(
    (changeEvent: ChangeEvent<HTMLInputElement>) => {
      const newValue = changeEvent.target.value;
      setInputValue(newValue);

      const event = new CustomEvent('input', {
        detail: newValue,
      });
      onInput(event);
    },
    [onInput],
  );

  return (
    // TODO think of using form
    <div className={styles.container} role="search">
      <input
        id="genealogical-indexes-search"
        type="search"
        value={inputValue}
        onChange={handleInputChange}
        className={styles.input}
        placeholder="Мельник"
        autoFocus={!initialValue}
        aria-label="Шукати в генеалогічних індексах"
      />
    </div>
  );
};

export default SearchControls;
