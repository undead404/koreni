'use client';

import { googleLogout } from '@react-oauth/google';
import { useRouter } from 'next/navigation';

import environment from '@/app/environment';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Sever the local Google Identity SDK state
    googleLogout();

    // 2. Execute backend cookie destruction
    fetch(new URL('/api/auth/me', environment.NEXT_PUBLIC_API_SITE), {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Logout failed');
          return;
        }
        router.push('/transcribe/login');
        return;
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    // 3. Purge frontend hydration state (if using Context/Zustand, clear it here)

    // 4. Force navigation to clear the DOM
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 text-white rounded"
    >
      Sign Out
    </button>
  );
}
