'use client';

import { type CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import requestApi from '@/app/services/api';

import { getSafeReturnPath } from '../components/account-auth-state';

import styles from './page.module.css';

export default function AccountLoginPage() {
  const router = useRouter();
  const searchParameters = useSearchParams();
  const returnTo = getSafeReturnPath(searchParameters.get('returnTo'));

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (!credentialResponse.credential) {
      toast.error('Не вдалося увійти через Google');
      return;
    }

    try {
      await requestApi('/api/auth/google', {
        body: JSON.stringify({ credential: credentialResponse.credential }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      router.replace(returnTo);
    } catch {
      toast.error('Не вдалося автентифікуватися');
    }
  };

  return (
    <main className={styles.root}>
      <section className={styles.card} aria-labelledby="login-title">
        <h1 id="login-title">Вхід до кабінету</h1>
        <p className={styles.description}>
          Увійдіть, щоб керувати акаунтом і прив&apos;язати його до
          Генеалогічного навігатора.
        </p>
        <div className={styles.googleControl}>
          <GoogleLogin
            onError={() => {
              toast.error('Не вдалося увійти через Google');
            }}
            onSuccess={(credentialResponse: CredentialResponse) => {
              void handleGoogleSuccess(credentialResponse);
            }}
          />
        </div>
      </section>
    </main>
  );
}
