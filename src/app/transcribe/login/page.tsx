'use client';

import { type CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import authGoogle from '../api/auth-google';

import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    try {
      await authGoogle(credentialResponse.credential);
      router.push('/transcribe');
    } catch {
      toast.error('Failed to authenticate');
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
