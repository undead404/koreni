'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type SyntheticEvent, useEffect, useRef, useState } from 'react';

import requestApi, { ApiRequestError } from '@/app/services/api';

import {
  karmaLinkResponseSchema,
  type KarmaLookup,
  karmaLookupResponseSchema,
  type KarmaStatus,
  karmaStatusResponseSchema,
} from './schemata';

import styles from './page.module.css';

type ViewState = 'loading' | 'ready' | 'submitting' | 'error';
type LookupState = 'idle' | 'loading' | 'ready' | 'error';

export default function KarmaConnectionsPage() {
  const [status, setStatus] = useState<KarmaStatus | null>(null);
  const [code, setCode] = useState('');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [linkAwarded, setLinkAwarded] = useState<number | null>(null);
  const [lookup, setLookup] = useState<KarmaLookup | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [lookupRetryNonce, setLookupRetryNonce] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestGeneration = useRef(0);
  const lookupGeneration = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const generation = ++requestGeneration.current;
    let mounted = true;
    const controller = new AbortController();

    const loadStatus = async () => {
      try {
        const response = await requestApi('/api/karma/status', {
          signal: controller.signal,
        });
        const data = karmaStatusResponseSchema.parse(await response.json());
        if (!mounted || generation !== requestGeneration.current) return;
        setStatus(data);
        setViewState('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!mounted || generation !== requestGeneration.current) return;
        if (error instanceof ApiRequestError && error.status === 401) {
          setViewState('error');
          router.replace('/account/login');
          return;
        }
        setMessage('Не вдалося розрахувати внесок. Спробуйте ще раз.');
        setViewState('error');
      }
    };

    void loadStatus();

    return () => {
      mounted = false;
      controller.abort();
      requestGeneration.current += 1;
    };
  }, [retryNonce, router]);

  useEffect(() => {
    if (!status?.user.karma_linked_at) {
      return;
    }

    const generation = ++lookupGeneration.current;
    let mounted = true;
    const controller = new AbortController();

    const loadLookup = async () => {
      try {
        const response = await requestApi('/api/karma/lookup', {
          signal: controller.signal,
        });
        const data = karmaLookupResponseSchema.parse(await response.json());
        if (!mounted || generation !== lookupGeneration.current) return;
        setLookup(data);
        setLookupState('ready');
      } catch {
        if (controller.signal.aborted) return;
        if (!mounted || generation !== lookupGeneration.current) return;
        setLookupState('error');
      }
    };

    void loadLookup();

    return () => {
      mounted = false;
      controller.abort();
      lookupGeneration.current += 1;
    };
  }, [lookupRetryNonce, status?.user.karma_linked_at]);

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (viewState === 'submitting' || code.length !== 10) return;

    const generation = ++requestGeneration.current;
    setViewState('submitting');
    setMessage(null);

    try {
      const response = await requestApi('/api/karma/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = karmaLinkResponseSchema.parse(await response.json());
      if (generation !== requestGeneration.current) return;
      if (!status) return;
      setStatus({
        ...status,
        user: { ...status.user, karma_linked_at: new Date().toISOString() },
      });
      setLinkAwarded(data.awarded);
      setMessage("Акаунт успішно прив'язано.");
      setCode('');
      setViewState('ready');
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      if (error instanceof ApiRequestError && error.status === 404) {
        setMessage('Код недійсний або вже прострочений.');
      } else if (error instanceof ApiRequestError && error.status === 409) {
        setMessage('Цей акаунт уже прив’язано.');
      } else {
        setMessage('Не вдалося прив’язати акаунт. Спробуйте ще раз.');
      }
      setViewState('ready');
    }
  };

  if (viewState === 'loading') {
    return (
      <main className={styles.root}>
        <p>Завантаження...</p>
        <p>Розрахунок може тривати до 15 хвилин. Не закривайте цю вкладку.</p>
      </main>
    );
  }
  if (viewState === 'error') {
    return (
      <main className={styles.root}>
        <p role="alert">{message}</p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            setMessage(null);
            setViewState('loading');
            setRetryNonce((value) => value + 1);
          }}
        >
          Спробувати ще раз
        </button>
      </main>
    );
  }
  if (!status) return null;

  return (
    <main className={styles.root}>
      <section className={styles.card} aria-labelledby="karma-title">
        <h1 id="karma-title">Карма</h1>
        <p className={styles.email}>{status.user.email}</p>
        <p className={styles.score}>
          Ви долучилися до <strong>{status.tables}</strong>{' '}
          {status.tables === 1 ? 'таблиці' : 'таблиць'}, що містять{' '}
          <strong>{status.rows}</strong> рядків даних.
        </p>
        {status.tables === 0 && (
          <p role="status">
            Таблиць за цією електронною адресою не знайдено. Якщо Ви є в розділі{' '}
            <Link href="/volunteers">Волонтерів</Link>, напишіть нам на{' '}
            <a href="mailto:admin@koreni.org.ua">admin@koreni.org.ua</a> з
            <strong>тієї самої</strong> електронної адреси, яку вказували під
            час подання таблиць. Швиденько все виправимо.
          </p>
        )}
        {status.user.karma_linked_at ? (
          <>
            <p className={styles.success} role="status">
              Акаунт успішно прив&apos;язано до Генеалогічного навігатора (
              {new Date(status.user.karma_linked_at).toLocaleString('uk-UA')}).
            </p>
            {message && <p className={styles.success}>{message}</p>}
            {linkAwarded !== null && (
              <p className={styles.success} role="status">
                Під час прив&apos;язки нараховано {linkAwarded} балів карми.
              </p>
            )}
            {(lookupState === 'loading' || lookupState === 'idle') && (
              <p role="status">Оновлюємо дані про карму...</p>
            )}
            {lookupState === 'error' && (
              <div>
                <p className={styles.error} role="alert">
                  Не вдалося оновити дані про карму. Спробуйте ще раз.
                </p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    setLookupState('loading');
                    setLookupRetryNonce((value) => value + 1);
                  }}
                >
                  Оновити дані
                </button>
              </div>
            )}
            {lookupState === 'ready' && lookup?.found && (
              <dl className={styles.karmaSummary}>
                <div>
                  <dt>Карма від Koreni</dt>
                  <dd>{lookup.serviceKarma}</dd>
                </div>
                <div>
                  <dt>Загальна карма</dt>
                  <dd>{lookup.totalKarma}</dd>
                </div>
              </dl>
            )}
            {lookupState === 'ready' && lookup && !lookup.found && (
              <p className={styles.error} role="alert">
                Не вдалося знайти прив&apos;язку в Навігаторі. Спробуйте оновити
                сторінку або зверніться до нас.
              </p>
            )}
          </>
        ) : (
          <form
            onSubmit={(event) => {
              void submit(event);
            }}
            className={styles.form}
          >
            <label htmlFor="navigator-code">
              Код із Генеалогічного навігатора
            </label>
            <input
              id="navigator-code"
              value={code}
              onChange={(event) => {
                setCode(
                  event.target.value
                    .toUpperCase()
                    .replaceAll(/[^A-Z0-9]/g, '')
                    .slice(0, 10),
                );
              }}
              minLength={10}
              maxLength={10}
              autoComplete="one-time-code"
              required
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={viewState === 'submitting' || code.length !== 10}
            >
              {viewState === 'submitting'
                ? 'Прив’язування...'
                : 'Прив’язати акаунт'}
            </button>
            {message && (
              <p className={styles.error} role="alert">
                {message}
              </p>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
