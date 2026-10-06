'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type SyntheticEvent, useEffect, useState } from 'react';

import requestApi from '@/app/services/api';

import {
  emailVisibilitySchema,
  emailVisibilityUpdateResponseSchema,
  type User,
  userResponseSchema,
} from './schemata';

import styles from './page.module.css';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [showEmail, setShowEmail] = useState<boolean | null>(null);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [isLoadingVisibility, setIsLoadingVisibility] = useState(true);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [rebuildNotice, setRebuildNotice] = useState<string | null>(null);
  const [dispatchWarning, setDispatchWarning] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isCurrent = true;
    const loadAccount = async () => {
      const userRequest = requestApi('/api/auth/me');
      const visibilityRequest = requestApi('/api/auth/email-visibility');
      const [userResult, visibilityResult] = await Promise.allSettled([
        userRequest,
        visibilityRequest,
      ]);

      if (!isCurrent) return;
      if (userResult.status === 'rejected') {
        router.replace('/account/login');
        return;
      }

      try {
        const userData: unknown = await userResult.value.json();
        setUser(userResponseSchema.parse(userData).user);
      } catch {
        router.replace('/account/login');
        return;
      }

      if (visibilityResult.status === 'fulfilled') {
        try {
          const visibilityData: unknown = await visibilityResult.value.json();
          setShowEmail(emailVisibilitySchema.parse(visibilityData).show_email);
          setVisibilityError(null);
        } catch {
          setVisibilityError(
            'Не вдалося завантажити налаштування видимості електронної пошти. Спробуйте ще раз.',
          );
        }
      } else {
        setVisibilityError(
          'Не вдалося завантажити налаштування видимості електронної пошти. Спробуйте ще раз.',
        );
      }
      setIsLoadingVisibility(false);
    };

    void loadAccount();
    return () => {
      isCurrent = false;
    };
  }, [router]);

  if (!user) {
    return (
      <main className={styles.root}>
        <p role="status">Завантаження кабінету...</p>
      </main>
    );
  }

  const reloadVisibility = async () => {
    setIsLoadingVisibility(true);
    setVisibilityError(null);
    try {
      const response = await requestApi('/api/auth/email-visibility');
      const data: unknown = await response.json();
      setShowEmail(emailVisibilitySchema.parse(data).show_email);
    } catch {
      setVisibilityError(
        'Не вдалося завантажити налаштування видимості електронної пошти. Спробуйте ще раз.',
      );
    } finally {
      setIsLoadingVisibility(false);
    }
  };

  const saveVisibility = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (showEmail === null || isSavingVisibility) return;

    setIsSavingVisibility(true);
    setVisibilityError(null);
    setRebuildNotice(null);
    setDispatchWarning(null);
    try {
      const response = await requestApi('/api/auth/email-visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_email: showEmail }),
      });
      const data: unknown = await response.json();
      const result = emailVisibilityUpdateResponseSchema.parse(data);
      setShowEmail(result.show_email);
      setRebuildNotice('Зміни з’являться на сайті після його перебудови.');
      if (result.rebuild_status === 'dispatch_failed') {
        setDispatchWarning(
          'Налаштування збережено, але не вдалося запустити перебудову сайту. Повторіть збереження, щоб спробувати ще раз.',
        );
      }
    } catch {
      setVisibilityError(
        'Не вдалося зберегти налаштування. Перевірте з’єднання та спробуйте ще раз.',
      );
    } finally {
      setIsSavingVisibility(false);
    }
  };

  return (
    <main className={styles.root}>
      <section className={styles.card} aria-labelledby="account-title">
        <h1 id="account-title">Ваш кабінет</h1>
        <p className={styles.identity}>Ви увійшли як {user.email}</p>
        <p className={styles.description}>
          Тут можна переглянути стан карми та прив&apos;язати акаунт до
          Генеалогічного навігатора.
        </p>
        <Link href="/account/karma">
          Переглянути карму та прив&apos;язати акаунт
        </Link>
        <section
          className={styles.visibility}
          aria-labelledby="visibility-title"
        >
          <h2 id="visibility-title">Видимість контактної електронної пошти</h2>
          <p>
            Налаштуйте, чи показувати адреси, зіставлені з вашим акаунтом, у
            профілі волонтера.
          </p>
          {isLoadingVisibility && (
            <p role="status">Завантаження налаштування...</p>
          )}
          {visibilityError && (
            <div className={styles.error} role="alert">
              <p>{visibilityError}</p>
              <button
                type="button"
                onClick={() => {
                  void reloadVisibility();
                }}
              >
                Спробувати ще раз
              </button>
            </div>
          )}
          {showEmail !== null && (
            <form
              onSubmit={(event) => {
                void saveVisibility(event);
              }}
            >
              <label className={styles.preference}>
                <input
                  checked={showEmail}
                  disabled={isSavingVisibility}
                  onChange={(event) => {
                    setShowEmail(event.currentTarget.checked);
                  }}
                  type="checkbox"
                />
                Показувати мою контактну електронну пошту у профілі волонтера
              </label>
              <button disabled={isSavingVisibility} type="submit">
                {isSavingVisibility ? 'Збереження...' : 'Зберегти налаштування'}
              </button>
            </form>
          )}
          {rebuildNotice && (
            <p className={styles.notice} role="status">
              {rebuildNotice}
            </p>
          )}
          {dispatchWarning && (
            <p className={styles.error} role="alert">
              {dispatchWarning}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
