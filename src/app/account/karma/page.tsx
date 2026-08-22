'use client';

import { useRouter } from 'next/navigation';
import { type SyntheticEvent, useEffect, useRef, useState } from 'react';

import requestApi, { ApiRequestError } from '@/app/services/api';

import {
  karmaLinkResponseSchema,
  type KarmaStatus,
  karmaStatusResponseSchema,
} from './schemata';

import styles from './page.module.css';

type ViewState = 'loading' | 'ready' | 'submitting' | 'error';

export default function KarmaConnectionsPage() {
  const [status, setStatus] = useState<KarmaStatus | null>(null);
  const [code, setCode] = useState('');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestGeneration = useRef(0);
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
      const result = karmaLinkResponseSchema.parse(await response.json());
      if (generation !== requestGeneration.current) return;
      if (!status) return;
      setStatus({
        ...status,
        user: { ...status.user, karma_linked_at: new Date().toISOString() },
      });
      setMessage(
        `Акаунт успішно прив'язано. Нараховано балів: ${String(result.awarded)}`,
      );
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
          Ваш внесок: <strong>{status.contribution}</strong> балів
        </p>
        {status.user.karma_linked_at ? (
          <>
            <p className={styles.success} role="status">
              Акаунт успішно прив&apos;язано до Генеалогічного навігатора (
              {new Date(status.user.karma_linked_at).toLocaleString('uk-UA')}).
            </p>
            {message && <p className={styles.success}>{message}</p>}
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
