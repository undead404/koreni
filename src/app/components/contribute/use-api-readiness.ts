import { useEffect, useRef, useState } from 'react';

import environment from '@/app/environment';
import { readinessResponseSchema } from '@/app/schemas/api';

const retryInterval = 60_000;

export default function useApiReadiness() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'unavailable'>(
    'checking',
  );
  const [retrySeconds, setRetrySeconds] = useState(0);
  const nextCheckAt = useRef(0);
  const request = useRef<AbortController | null>(null);

  const checkAgain = async () => {
    if (request.current || Date.now() < nextCheckAt.current) return;
    const controller = new AbortController();
    request.current = controller;
    nextCheckAt.current = Date.now() + retryInterval;
    setRetrySeconds(60);
    setStatus('checking');
    try {
      const response = await fetch(
        new URL('/api/ready', environment.NEXT_PUBLIC_API_SITE),
        {
          cache: 'no-store',
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10_000),
          ]),
        },
      );
      const body: unknown = response.ok ? await response.json() : null;
      if (!controller.signal.aborted)
        setStatus(
          readinessResponseSchema.safeParse(body).success
            ? 'ready'
            : 'unavailable',
        );
    } catch {
      if (!controller.signal.aborted) setStatus('unavailable');
    } finally {
      if (request.current === controller) request.current = null;
    }
  };

  useEffect(() => {
    void checkAgain();
    return () => {
      request.current?.abort();
      request.current = null;
      nextCheckAt.current = 0;
    };
  }, []);

  useEffect(() => {
    if (status === 'ready') return;
    const timer = setInterval(() => {
      setRetrySeconds(
        Math.max(0, Math.ceil((nextCheckAt.current - Date.now()) / 1000)),
      );
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [status]);

  return { status, retrySeconds, checkAgain };
}
