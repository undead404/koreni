export function normalizePathname(pathname: string | null): string {
  if (!pathname) return '';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isLoginRoute(pathname: string | null): boolean {
  const normalized = normalizePathname(pathname);
  return normalized === '/account/login';
}

const defaultReturnPath = '/account';

export function getSafeReturnPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return defaultReturnPath;
  }

  const pathname = value.split(/[?#]/, 1)[0] ?? null;
  if (isLoginRoute(pathname)) {
    return defaultReturnPath;
  }

  return value;
}

export function getLoginRedirectPath(
  pathname: string | null,
  searchParameters: URLSearchParams,
): string {
  const normalizedPathname = pathname || '/';
  const query = searchParameters.toString();
  const returnTo = `${normalizedPathname}${query ? `?${query}` : ''}`;

  return `/account/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export class RequestGenerationTracker {
  private currentGeneration = 0;

  public nextGeneration(): number {
    this.currentGeneration += 1;
    return this.currentGeneration;
  }

  public isCurrent(generation: number): boolean {
    return generation === this.currentGeneration;
  }

  public invalidate(): void {
    this.currentGeneration += 1;
  }
}
