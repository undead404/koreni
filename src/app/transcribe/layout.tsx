import { GoogleOAuthProvider } from '@react-oauth/google';

import environment from '@/app/environment';

export default function TranscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={environment.NEXT_PUBLIC_OAUTH_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
