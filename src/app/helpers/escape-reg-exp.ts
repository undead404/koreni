/**
 * Escapes special regex characters in a string to make it safe for use in a RegExp.
 * @param string - The string to escape
 * @returns The escaped string
 */
export default function escapeRegExp(string: string): string {
  return string.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
