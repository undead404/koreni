import { GoogleOAuthProvider } from '@react-oauth/google';
import type { Metadata } from 'next';

import environment from '@/app/environment';

import AccountHeader from './components/account-header';
import AccountSWRProvider from './components/account-swr-provider';

export const metadata: Metadata = {
  title: 'Кабінет',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={environment.NEXT_PUBLIC_OAUTH_CLIENT_ID}>
      <AccountSWRProvider>
        <AccountHeader />
        {children}
      </AccountSWRProvider>
    </GoogleOAuthProvider>
  );
}
