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
