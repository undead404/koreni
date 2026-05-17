import clsx from 'clsx';
import { AlertTriangle, X } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { type KeyboardEvent, useRef, useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';

import { UKR_ARCHIVE_REGEX } from '@/app/helpers/ukr-archive-regex';

import type { ContributeFormValues } from './types';

import styles from './archive-items-input.module.css';

export default function ArchiveItemsInput({
  value,
  onChange,
}: ControllerRenderProps<ContributeFormValues, 'archiveItems'>) {
  const [tagInput, setTagInput] = useState('');
  const inputReference = useRef<HTMLInputElement>(null);
  const posthog = usePostHog();

  const handleRemove = (archiveItemCode: string) => {
    onChange(value.filter((item) => item.item !== archiveItemCode));
    posthog.capture('archive_item_removed', { archive_item: archiveItemCode });
    inputReference.current?.focus();
  };

  const handleAdd = (archiveItemCode: string) => {
    const trimmed = archiveItemCode.trim();
    if (
      !trimmed ||
      value.some((v) => v.item.toLowerCase() === trimmed.toLowerCase())
    ) {
      return;
    }

    posthog.capture('archive_item_added', { archive_item: trimmed });
    onChange([...value, { item: trimmed }]);
    setTagInput('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleAdd(tagInput);
    } else if (event.key === 'Backspace' && tagInput === '') {
      const lastItem = value.at(-1);
      if (lastItem) handleRemove(lastItem.item);
    }
  };

  const handleBlur = () => {
    if (tagInput.trim() !== '') handleAdd(tagInput);
  };

  const hasSomeStandard = value.some((code) =>
    UKR_ARCHIVE_REGEX.test(code.item),
  );
  const isTypingValid =
    tagInput.trim() === '' || UKR_ARCHIVE_REGEX.test(tagInput.trim());

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
        {!hasSomeStandard && (
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
        })}

        <input
          ref={inputReference}
          id="next-archive-item-input"
          type="text"
          className={styles.tagInput}
          placeholder={value.length === 0 ? 'ДАХмО-315-1-8563...' : ''}
          value={tagInput}
          onChange={(event) => {
            setTagInput(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          aria-invalid={!isTypingValid}
          aria-describedby="archive-item-enter-hint"
        />

        {tagInput.trim() !== '' && (
          <button
            type="button"
            className={styles.addButton}
            aria-label="Додати архівну справу"
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              handleAdd(tagInput);
              inputReference.current?.focus();
            }}
          >
            Додати
          </button>
        )}
      </div>

      {tagInput.trim() !== '' && (
        <p id="archive-item-enter-hint" className={styles.enterHint}>
          Натисніть Enter, щоб додати
        </p>
      )}

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
