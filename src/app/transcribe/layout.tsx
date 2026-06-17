import { GoogleOAuthProvider } from '@react-oauth/google';

import environment from '@/app/environment';

import TranscribeHeader from './components/transcribe-header';

export default function TranscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={environment.NEXT_PUBLIC_OAUTH_CLIENT_ID}>
      <TranscribeHeader />
      {children}
    </GoogleOAuthProvider>
  );
}
