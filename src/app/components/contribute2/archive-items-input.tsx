import { X } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';

import type { ContributeForm2Values } from './types';

import styles from './archive-items-input.module.css';

export default function ArchiveItemsInput({
  value = [],
  onChange,
}: ControllerRenderProps<ContributeForm2Values, 'archiveItems'>) {
  const [tagInput, setTagInput] = useState('');
  const handleRemove = useCallback(
    (archiveItemCode: string) =>
      onChange(value.filter((item) => item.item !== archiveItemCode)),
    [onChange, value],
  );
  const handleAdd = useCallback(
    (archiveItemCode: string) => {
      onChange([...value, { item: archiveItemCode }]);
      setTagInput('');
    },
    [onChange, value],
  );
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        handleAdd(tagInput);
      } else if (
        event.key === 'Backspace' &&
        tagInput === '' &&
        value.length > 0
      ) {
        handleRemove(value.at(-1)!.item);
      }
    },
    [tagInput, value, handleAdd, handleRemove],
  );

  return (
    <>
      <label className={styles.label} htmlFor="next-archive-item-input">
        Шифри архівних справ
      </label>
      <div className={styles.tagsWrap}>
        {value.map((tag) => (
          <span key={tag.item} className={styles.tag}>
            {tag.item}
            <button
              type="button"
              className={styles.tagRemove}
              onClick={(event) => {
                event.stopPropagation();
                handleRemove(tag.item);
              }}
              aria-label={`Remove ${tag.item}`}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          id="next-archive-item-input"
          type="text"
          className={styles.tagInput}
          placeholder={value.length === 0 ? 'Введіть і натисніть Enter...' : ''}
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (tagInput.trim()) handleAdd(tagInput);
          }}
        />
      </div>
    </>
  );
}
