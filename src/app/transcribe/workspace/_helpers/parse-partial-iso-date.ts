/**
 * Matches a Partial ISO date string in one of three forms:
 *   YYYY
 *   YYYY-MM  (month 01–12)
 *   YYYY-MM-DD  (month 01–12, day 01–31)
 *
 * Anchored — rejects any surrounding characters, dots, slashes, prose, or
 * partial segments.
 */
export const PARTIAL_ISO_REGEX =
  /^\d{4}(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?)?$/;

/**
 * Returns the integer year extracted from a Partial ISO string, or `null` if
 * the value is empty or does not match the Partial ISO format.
 *
 * No external dependencies. No I/O.
 */
export function parsePartialIsoYear(value: string): number | null {
  if (!PARTIAL_ISO_REGEX.test(value)) return null;
  return Number.parseInt(value.slice(0, 4), 10);
}
