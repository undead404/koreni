import { Suspense } from 'react';

import LoginClient from './login-client';

export default function AccountLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
