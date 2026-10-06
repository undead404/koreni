'use client';

import { SWRConfig } from 'swr';

interface AccountSWRProviderProperties {
  children: React.ReactNode;
}

export default function AccountSWRProvider({
  children,
}: AccountSWRProviderProperties) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 2000,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
