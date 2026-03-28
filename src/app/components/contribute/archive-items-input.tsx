import clsx from 'clsx';
import { AlertTriangle, X } from 'lucide-react';
import posthog from 'posthog-js';
import {
  type KeyboardEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ControllerRenderProps } from 'react-hook-form';

import { UKR_ARCHIVE_REGEX } from '@/app/helpers/ukr-archive-regex';

import type { ContributeFormValues } from './types';

import styles from './archive-items-input.module.css';

export default function ArchiveItemsInput({
  value = [],
  onChange,
}: ControllerRenderProps<ContributeFormValues, 'archiveItems'>) {
  const [tagInput, setTagInput] = useState('');
  const inputReference = useRef<HTMLInputElement>(null);

  const handleRemove = useCallback(
    (archiveItemCode: string) => {
      onChange(value.filter((item) => item.item !== archiveItemCode));
      posthog.capture('archive_item_removed', {
        archive_item: archiveItemCode,
      });
      inputReference.current?.focus();
    },
    [onChange, value],
  );

  const handleAdd = useCallback(
    (archiveItemCode: string) => {
      const trimmed = archiveItemCode.trim();
      if (
        !trimmed ||
        value.some((v) => v.item.toLowerCase() === trimmed.toLowerCase())
      ) {
        return;
      }

      posthog.capture('archive_item_added', {
        archive_item: trimmed,
      });

      onChange([...value, { item: trimmed }]);
      setTagInput('');
    },
    [onChange, value],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
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

  const hasSomeStandard = useMemo(
    () => value.some((code) => UKR_ARCHIVE_REGEX.test(code.item)),
    [value],
  );

  const isTypingValid =
    tagInput.trim() === '' || UKR_ARCHIVE_REGEX.test(tagInput.trim());

  const renderedTags = useMemo(
    () =>
      value.map((tag) => {
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
              <AlertTriangle size={14} className={styles.warningIcon} />
            )}
            {tag.item}
            <button
              type="button"
              className={styles.tagRemove}
              onClick={(event) => {
                event.stopPropagation();
                handleRemove(tag.item);
              }}
              title={`Видалити ${tag.item}`}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </span>
        );
      }),
    [value, handleRemove],
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

      <div
        className={clsx(styles.tagsWrap, {
          [styles.tagsWrapInvalid]: !isTypingValid,
        })}
      >
        {renderedTags}
        <input
          ref={inputReference}
          id="next-archive-item-input"
          type="text"
          className={styles.tagInput}
          placeholder={value.length === 0 ? 'ДАХмО-315-1-8563...' : ''}
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={!isTypingValid}
          aria-describedby="archive-item-enter-hint"
        />
      </div>

      {tagInput.trim() !== '' && (
        <p id="archive-item-enter-hint" className={styles.enterHint}>
          Натисніть Enter, щоб додати
        </p>
      )}

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
