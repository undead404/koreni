'use client';

import {
  type FocusEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Turnstile from 'react-turnstile';

import environment from '../environment';
import slugifyUkrainian from '../helpers/slugify-ukrainian';
import { submitErrorSchema, submitResponseSchema } from '../schemas/api';

import convertImportFormData from './convert-import-form-data';
import {
  resetImportPageState,
  restoreImportPageState,
  saveImportPageState,
} from './local-storage';

import styles from './import.module.css';

export default function ImportPage() {
  const [prUrl, setPrUrl] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isRange, setIsRange] = useState<boolean | null>(null);

  const formReference = useRef<HTMLFormElement>(null);
  const idInputReference = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedData = restoreImportPageState();
    if (savedData && formReference.current) {
      try {
        const form = formReference.current;

        for (const [name, value] of Object.entries(savedData)) {
          const element = form.elements.namedItem(name);
          if (
            (element instanceof HTMLInputElement ||
              element instanceof HTMLTextAreaElement ||
              element instanceof HTMLSelectElement) &&
            element.type !== 'file' &&
            element.type !== 'radio'
          ) {
            element.value = value;
          }
        }

        if (savedData._isRange === 'true') {
          setIsRange(true);
        }
        if (savedData._isRange === 'false') {
          setIsRange(false);
        }
      } catch (error) {
        console.error('Failed to load saved form data', error);
      }
    }
  }, []);

  const handleInputBlur = useCallback(
    (
      event: FocusEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value } = event.target;
      if (name === 'table') return;

      const data = restoreImportPageState() || {};
      data[name] = value;
      saveImportPageState(data);
    },
    [],
  );

  const handleTitleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      handleInputBlur(event);
      const title = event.target.value;
      if (
        title &&
        idInputReference.current &&
        !idInputReference.current.value
      ) {
        idInputReference.current.value = slugifyUkrainian(title);
        const data = restoreImportPageState() || {};
        data['id'] = idInputReference.current.value;
        saveImportPageState(data);
      }
    },
    [handleInputBlur],
  );

  const handleRangeChange = useCallback((newValue: boolean) => {
    setIsRange(newValue);
    const data = restoreImportPageState() || {};
    data['_isRange'] = newValue ? 'true' : 'false';
    saveImportPageState(data);
  }, []);

  const handleReset = useCallback(() => {
    if (confirm('Ви впевнені, що хочете очистити форму?')) {
      resetImportPageState();
      globalThis.location.reload();
    }
  }, []);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus(null);
      setIsSubmitting(true);
      try {
        if (isRange === null) {
          throw new Error('Invalid state');
        }

        const form = event.currentTarget;
        const formData = new FormData(form);

        const adjustedFormData = convertImportFormData(formData, { isRange });

        if (turnstileToken) {
          adjustedFormData.append('turnstileToken', turnstileToken);
        }

        const response = await fetch(
          new URL('/api/submit', environment.NEXT_PUBLIC_API_SITE),
          {
            method: 'POST',
            body: adjustedFormData,
          },
        );

        if (!response.ok) {
          const errorData = (await response.json()) as unknown;
          const errorResponse = submitErrorSchema.safeParse(errorData);
          if (errorResponse.success) {
            throw new Error(errorResponse.data.error);
          }
          throw new Error(`Невідома помилка: ${JSON.stringify(errorData)}`);
        }

        const responseData = (await response.json()) as unknown;
        const responseParsed = submitResponseSchema.parse(responseData);
        setPrUrl(responseParsed.url);

        setStatus({
          type: 'success',
          message: 'Таблиця успішно подана на розгляд!',
        });
        resetImportPageState();
        form.reset();
        setIsRange(null);
      } catch (error) {
        setStatus({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Сталася невідома помилка',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isRange, turnstileToken],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      void submit(event);
    },
    [submit],
  );

  return (
    <>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Додання на Корені власної таблиці</h1>
          <button
            disabled={isSubmitting}
            type="button"
            onClick={handleReset}
            className={styles.resetButton}
            title="Очистити форму та видалити збережені дані"
          >
            Очистити
          </button>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
          ref={formReference}
        >
          <div className={styles.field}>
            <label htmlFor="table" className={styles.label}>
              Файл таблиці у форматі CSV (UTF-8)
            </label>
            <p className={styles.description}>
              Поки що ми не приймаємо файли у інших форматах (наприклад, Excel).
              Експортуйте таблицю в форматі CSV (UTF-8). Перший рядок має
              містити <b>заголовки стовпців</b>.
            </p>
            <input
              disabled={isSubmitting}
              id="table"
              name="table"
              type="file"
              accept=".csv"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              Назва таблиці
            </label>
            <p className={styles.description}>
              Повна описова назва, яка буде відображатися на сайті.
            </p>
            <input
              disabled={isSubmitting}
              id="title"
              name="title"
              type="text"
              required
              minLength={10}
              maxLength={256}
              className={styles.input}
              placeholder="Перепис населення с. Андрушки 1897"
              onBlur={handleTitleBlur}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="id" className={styles.label}>
              Унікальний ID
            </label>
            <p className={styles.description}>
              Детальний ідентифікатор латиницею, наприклад:{' '}
              <code>DAKhmO-315-1-8563-Antonivka</code>.
            </p>
            <input
              disabled={isSubmitting}
              ref={idInputReference}
              id="id"
              name="id"
              type="text"
              required
              pattern="^[a-z\-0-9]+$"
              title="Лише маленькі латинські літери, цифри та дефіси"
              minLength={5}
              maxLength={128}
              className={styles.input}
              placeholder="e.g. 1897-andrushky"
              onBlur={handleInputBlur}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="authorName" className={styles.label}>
              Ім'я автора індексації (транскрибування)
            </label>
            <p className={styles.description}>
              Бажано використовувати справжнє ім'я, але якщо не хочете –
              вигадайте постійний псевдонім.
            </p>
            <input
              disabled={isSubmitting}
              id="authorName"
              name="authorName"
              type="text"
              required
              minLength={2}
              maxLength={128}
              className={styles.input}
              onBlur={handleInputBlur}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="authorEmail" className={styles.label}>
              Email автора
            </label>
            <p className={styles.description}>
              Необов'язково, але варто заповнити, аби зацікавлені читачі
              індексації могли з Вами зв'язатися.
            </p>
            <input
              disabled={isSubmitting}
              id="authorEmail"
              name="authorEmail"
              type="email"
              className={styles.input}
              onBlur={handleInputBlur}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="authorGithubUsername" className={styles.label}>
              Ім'я користувача на GitHub (необов'язково)
            </label>
            <p className={styles.description}>
              Введіть, якщо хочете отримувати сповіщення про розгляд і додання
              цієї таблиці на Корені.
            </p>
            <input
              disabled={isSubmitting}
              id="authorGithubUsername"
              name="authorGithubUsername"
              type="text"
              className={styles.input}
              onBlur={handleInputBlur}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="tableLocale" className={styles.label}>
              Мова таблиці
            </label>
            <p className={styles.description}>
              Код мови, якою написані дані в таблиці.
            </p>
            <select
              disabled={isSubmitting}
              id="tableLocale"
              name="tableLocale"
              defaultValue=""
              required
              className={styles.input}
              onBlur={handleInputBlur}
            >
              <option value="" disabled>
                Оберіть мову
              </option>
              <option value="pl" disabled>
                Польська (тимчасово не підтримується)
              </option>
              <option value="uk">Українська</option>
              <option value="ru">Російська</option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Роки</span>
            <p className={styles.description}>
              Ця таблиця стосується одного року чи діапазону років?
            </p>
            <div className={styles.radioGroup}>
              <label>
                <input
                  disabled={isSubmitting}
                  type="radio"
                  name="periodType"
                  checked={isRange === false}
                  onChange={() => handleRangeChange(false)}
                  required
                />{' '}
                Один рік
              </label>
              <label>
                <input
                  disabled={isSubmitting}
                  type="radio"
                  name="periodType"
                  checked={isRange === true}
                  onChange={() => handleRangeChange(true)}
                  required
                />{' '}
                Період
              </label>
            </div>

            {isRange ? (
              <div className={styles.yearsRow}>
                <input
                  disabled={isSubmitting}
                  name="yearStart"
                  type="number"
                  required
                  className={styles.yearInput}
                  placeholder="З (1897)"
                  min="1600"
                  max="2030"
                  onBlur={handleInputBlur}
                />
                <input
                  disabled={isSubmitting}
                  name="yearEnd"
                  type="number"
                  required
                  className={styles.yearInput}
                  placeholder="По (1910)"
                  min="1600"
                  max="2030"
                  onBlur={handleInputBlur}
                />
              </div>
            ) : (
              <input
                disabled={isSubmitting}
                name="year"
                type="number"
                required
                className={styles.yearInput}
                placeholder="1897"
                min="1600"
                max="2030"
                onBlur={handleInputBlur}
              />
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="location" className={styles.label}>
              Координати (Широта, Довгота)
            </label>
            <p className={styles.description}>
              Введіть два числа через кому. Можна знайти на Google Maps.
              Наприклад: <code>50.45, 30.52</code>.
            </p>
            <input
              disabled={isSubmitting}
              id="location"
              name="location"
              type="text"
              required
              pattern="^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$"
              title="Формат: широта, довгота (два десяткові числа через кому)"
              className={styles.input}
              placeholder="50.45, 30.52"
              onBlur={handleInputBlur}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="archiveItems" className={styles.label}>
              Архівні шифри
            </label>
            <p className={styles.description}>
              Перелік архівних справ, з яких взято дані. Кожен шифр з нового
              рядка.
            </p>
            <textarea
              disabled={isSubmitting}
              id="archiveItems"
              name="archiveItems"
              required
              minLength={5}
              className={styles.textarea}
              placeholder="ДАКО-384-10-242"
              onBlur={handleInputBlur}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="sources" className={styles.label}>
              Вихідні таблиці
            </label>
            <p className={styles.description}>
              Публічно доступні таблиці, наприклад, на Google Spreadsheets.
            </p>
            <textarea
              disabled={isSubmitting}
              id="sources"
              name="sources"
              minLength={10}
              className={styles.textarea}
              placeholder="https://example.com/source"
              onBlur={handleInputBlur}
            />
          </div>

          <Turnstile
            sitekey={environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onVerify={setTurnstileToken}
          />

          <button
            type="submit"
            disabled={isSubmitting || !turnstileToken}
            className={styles.button}
          >
            {isSubmitting ? 'Подається...' : 'Подати'}
          </button>
        </form>

        {status && (
          <div
            className={`${styles.status} ${
              status.type === 'success' ? styles.success : styles.error
            }`}
          >
            {status.message}
          </div>
        )}
        {prUrl && (
          <div className={styles.status}>
            {' '}
            Переглянути статус поданої таблиці можна за посиланням:{' '}
            <a href={prUrl} target="_blank" rel="noreferrer">
              Pull Request
            </a>
          </div>
        )}
        {status?.type !== 'success' && (
          <div className={styles.comforting}>
            Якщо не виходить подати таблицю через форму – Ви завжди можете
            надіслати її нам на пошту:{' '}
            <a href="mailto:brute18@gmail.com">brute18@gmail.com</a>
          </div>
        )}
      </div>
    </>
  );
}
