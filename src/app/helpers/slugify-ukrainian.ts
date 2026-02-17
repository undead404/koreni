/**
 * Slugifies Ukrainian text according to the official 2010 transliteration rules
 * (Cabinet of Ministers Resolution No. 55).
 */
export default function slugifyUkrainian(text: string): string {
  if (!text) return '';

  // 1. Normalize and lowercase for consistent processing
  // We keep it temporarily in original case or specific format if we wanted to preserve casing,
  // but for slugifying, we usually want lowercase immediately or at the end.
  // However, strict transliteration relies on "Start of Word" detection.
  // It is safer to transliterate FIRST (preserving case/spaces), THEN slugify.

  let result = text.toLowerCase();

  // 2. Handle the "zg" -> "zgh" exception first to avoid conflict with "z" + "h"
  result = result.replaceAll('зг', 'zgh');

  // 3. Define the position-dependent replacements (Start of word vs. Other)
  // Resolution 55 defines "Start of word" as:
  // - The absolute beginning of the string
  // - Following a space (or potentially other separators, but space is primary)

  const substitutions = [
    { char: 'є', other: 'ie', start: 'ye' },
    { char: 'ї', other: 'i', start: 'yi' },
    { char: 'й', other: 'i', start: 'y' },
    { char: 'ю', other: 'iu', start: 'yu' },
    { char: 'я', other: 'ia', start: 'ya' },
  ];

  // Apply position-dependent rules
  for (const { char, start, other } of substitutions) {
    // Regex explanation:
    // (^|\s) captures start of string OR a whitespace character
    // We utilize the capture group $1 to preserve the space if it existed.
    const regex = new RegExp(`(^|\\s)${char}`, 'g');

    result = result.replace(regex, (match, separator) => {
      // If the original char was uppercase, ideally we'd match case, but for slugs
      // everything becomes lowercase anyway. We just insert the 'start' variant.
      return separator + start;
    });

    // Replace all remaining instances (not at start) with the 'other' variant
    result = result.replaceAll(char, other);
  }

  // 4. Standard single-character mapping
  const map: Record<string, string> = {
    "'": '',
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'h',
    ґ: 'g',
    д: 'd',
    е: 'e',
    ж: 'zh',
    з: 'z',
    и: 'y',
    і: 'i',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ь: '',
    '’': '', // Soft sign and apostrophe are skipped
  };

  result = result.replaceAll(
    // eslint-disable-next-line regexp/no-obscure-range
    /[а-яґєії'’]/g,
    (char) => map[char] || char,
  );

  // 5. Final Slugification
  return result
    .trim()
    .replaceAll(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric (except spaces and hyphens)
    .replaceAll(/\s+/g, '-') // Replace spaces with hyphens
    .replaceAll(/-+/g, '-'); // Remove duplicate hyphens
}
