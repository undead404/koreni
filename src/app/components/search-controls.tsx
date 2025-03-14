import {
  type ChangeEvent,
  type FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import getTypesenseClient from '../services/typesense';

import styles from './search-controls.module.css';

interface ControlsProperties {
  query: string;
  client: ReturnType<typeof getTypesenseClient>;
  onInput: (event: CustomEvent<string>) => void;
}

const SearchControls: FC<ControlsProperties> = ({ query, onInput }) => {
  const [inputValue, setInputValue] = useState(query);
  const inputReference = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleInputChange = useCallback(
    (changeEvent: ChangeEvent<HTMLInputElement>) => {
      const newValue = changeEvent.target.value;
      setInputValue(newValue);

      const event = new CustomEvent('input', {
        detail: newValue,
      });
      onInput(event);

      if (inputReference.current) {
        const { selectionStart, selectionEnd } = changeEvent.target;
        setTimeout(() => {
          if (inputReference.current) {
            inputReference.current.setSelectionRange(
              selectionStart,
              selectionEnd,
            );
          }
        }, 0);
      }
    },
    [onInput],
  );

  return (
    // TODO think of using form
    <div className={styles.container} role="search">
      <input
        id="genealogical-indexes-search"
        ref={inputReference}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        className={styles.input}
        placeholder="Мельник"
        autoFocus={!query}
        aria-label="Шукати в генеалогічних індексах"
      />
    </div>
  );
};

export default SearchControls;
