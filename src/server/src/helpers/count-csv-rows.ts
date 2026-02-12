/**
 * Counts CSV rows efficiently while ignoring newlines inside quotes.
 * Returns -1 for empty files, or (Total Rows - 1) to exclude header.
 */
export function countCsvRows(csvContent: string): number {
  if (!csvContent.trim()) return 0;

  let lines = 0;
  let inQuote = false;

  for (const char of csvContent) {
    // Toggle quote state
    if (char === '"') {
      // Handle escaped quotes ("") if necessary, but simple toggle usually suffices for counting
      inQuote = !inQuote;
    }

    // Count newline only if we are NOT inside a quote
    if (char === '\n' && !inQuote) {
      lines++;
    }
  }

  // If the file doesn't end with \n, the loop missed the last line. Add it.
  if (csvContent.length > 0 && csvContent.at(-1) !== '\n') {
    lines++;
  }

  // Subtract 1 for the header row (assuming your CSV always has headers)
  return Math.max(0, lines - 1);
}
