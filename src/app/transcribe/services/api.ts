import environment from '@/app/environment';
import { initBugsnag } from '@/app/services/bugsnag';

export const getProjectSchemas = async () => {
  return [
    {
      enabled: true,
      label: 'Late russian confession list',
      value: 'confession-list',
    },
    {
      enabled: false,
      label: 'Late russian parish register',
      value: 'parish-register',
    },
  ];
};

export default async function requestApi(
  path: string,
  parameters?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(
      new URL(path, environment.NEXT_PUBLIC_API_SITE),
      {
        credentials: 'include',
        ...parameters,
      },
    );
    if (!response.ok) {
      throw new Error('Request failed');
    }
    return response;
  } catch (error) {
    console.error(error);
    initBugsnag().notify(error as Error);
    throw error;
  }
}
