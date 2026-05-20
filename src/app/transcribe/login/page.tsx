'use client';

import { type CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';

import environment from '@/app/environment';

import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    const response = await fetch(
      new URL('/api/auth/google', environment.NEXT_PUBLIC_API_SITE),
      {
        body: JSON.stringify({ credential: credentialResponse.credential }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    );

    if (response.ok) {
      // Backend set the HttpOnly cookie. Hydrate local state and redirect.
      router.push('/transcribe');
    } else {
      console.error('Authentication rejected by backend');
    }
  };

  return (
    <section className={styles.root}>
      <GoogleLogin
        onSuccess={(credentialResponse: CredentialResponse) => {
          void handleGoogleSuccess(credentialResponse);
        }}
        onError={() => {
          console.error('GIS SDK Error');
        }}
        useOneTap={true} // Automatically displays the prompt if a session exists
      />
    </section>
  );
}
