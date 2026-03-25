import clsx from 'clsx'; // Assuming you use clsx or similar for class merging
import { AlertTriangle, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';

import type { ContributeForm2Values } from './types';

import styles from './archive-items-input.module.css';

// Approximate regex for standard signatures (adjust to your specific rules)
// eslint-disable-next-line regexp/no-obscure-range
const UKR_ARCHIVE_REGEX = /^[А-ЯІЇЄҐа-яіїєґ]+-[РП]?\d+-\d+[а-я]*-\d+[а-я]*$/;

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
      const trimmed = archiveItemCode.trim();
      if (!trimmed || value.some((v) => v.item === trimmed)) return;

      onChange([...value, { item: trimmed }]);
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

  const hasSomeStandard = value.some((code) =>
    UKR_ARCHIVE_REGEX.test(code.item),
  );

  return (
    <>
      <div className={styles.labelWrap}>
        <label className={styles.label} htmlFor="next-archive-item-input">
          Шифри архівних справ
        </label>
        <p className={styles.hint}>
          Формат: Архів-Фонд-Опис-Справа (напр. ДАХмО-315-1-8563,
          ДАВіО-Р6129-8-87, ДАХмО-227-5доп-252).
        </p>
        {hasSomeStandard ? null : (
          <p className={clsx(styles.hint, styles.warningText)}>
            Якщо таблиця не заснована на українських архівних справах, вкажіть
            той шифр документа, який є.
          </p>
        )}
      </div>

      <div className={styles.tagsWrap}>
        {value.map((tag) => {
          const isStandard = UKR_ARCHIVE_REGEX.test(tag.item);

          return (
            <span
              key={tag.item}
              className={clsx(styles.tag, { [styles.tagWarning]: !isStandard })}
              title={
                isStandard
                  ? ''
                  : 'Нестандартний формат. Перевірте правильність введення.'
              }
            >
              {!isStandard && (
                <AlertTriangle size={12} className={styles.warningIcon} />
              )}
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
          );
        })}
        <input
          id="next-archive-item-input"
          type="text"
          className={styles.tagInput}
          placeholder={value.length === 0 ? 'ДАХмО-315-1-8563...' : ''}
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (tagInput.trim()) handleAdd(tagInput);
          }}
        />
      </div>
      {/* Optional: Render a single warning text below the input if any tags are non-standard */}
      {value.some((tag) => !UKR_ARCHIVE_REGEX.test(tag.item)) && (
        <div className={styles.warningText}>
          ⚠️ Один або декілька шифрів не відповідають стандартному формату
          (Архів-Фонд-Опис-Справа). Якщо так і має бути, проігноруйте це
          повідомлення.
        </div>
      )}
    </>
  );
}
