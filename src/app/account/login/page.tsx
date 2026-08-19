'use client';

import { type CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import requestApi from '@/app/services/api';

import styles from './page.module.css';

export default function AccountLoginPage() {
  const router = useRouter();

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (!credentialResponse.credential) {
      toast.error('Google login failed');
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
      router.replace('/account');
    } catch {
      toast.error('Failed to authenticate');
    }
  };

  return (
    <section className={styles.root}>
      <GoogleLogin
        onError={() => {
          toast.error('Google login failed');
        }}
        onSuccess={(credentialResponse: CredentialResponse) => {
          void handleGoogleSuccess(credentialResponse);
        }}
      />
    </section>
  );
}
