const monographsMap = new Map<string, string>([
  ['a', 'а'],
  ['b', 'б'],
  ['c', 'ц'],
  ['d', 'д'],
  ['e', 'е'],
  ['f', 'ф'],
  ['g', 'ґ'],
  ['h', 'г'],
  ['i', 'і'],
  ['j', 'й'],
  ['k', 'к'],
  ['l', 'л'],
  ['m', 'м'],
  ['n', 'н'],
  ['o', 'о'],
  ['p', 'п'],
  ['q', 'к'],
  ['r', 'р'],
  ['s', 'с'],
  ['t', 'т'],
  ['u', 'у'],
  ['v', 'в'],
  ['w', 'в'],
  ['x', 'кс'],
  ['y', 'и'],
  ['z', 'з'],
  ['A', 'А'],
  ['B', 'Б'],
  ['C', 'Ц'],
  ['D', 'Д'],
  ['E', 'Е'],
  ['F', 'Ф'],
  ['G', 'Ґ'],
  ['H', 'Г'],
  ['I', 'І'],
  ['J', 'Й'],
  ['K', 'К'],
  ['L', 'Л'],
  ['M', 'М'],
  ['N', 'Н'],
  ['O', 'О'],
  ['P', 'П'],
  ['Q', 'К'],
  ['R', 'Р'],
  ['S', 'С'],
  ['T', 'Т'],
  ['U', 'У'],
  ['V', 'В'],
  ['W', 'В'],
  ['X', 'Кс'],
  ['Y', 'И'],
  ['Z', 'З'],
  ['Ъ', ''],
  ['ъ', ''],
  ['э', 'е'],
  ['Ы', 'И'],
  ['ы', 'и'],
]);

const digraphsMap = new Map<string, string>([
  ['Ph', 'Ф'],
  ['Shch', 'Щ'],
  ['Sh', 'Ш'],
  ['Ch', 'Ч'],
  ['Zh', 'Ж'],
  ['Ts', 'Ц'],
  ['Kh', 'Х'],
  ['Zgh', 'Зг'],
  ['ph', 'ф'],
  ['shch', 'щ'],
  ['sh', 'ш'],
  ['ch', 'ч'],
  ['zh', 'ж'],
  ['ts', 'ц'],
  ['kh', 'х'],
  ['zgh', 'зг'],
  ['ie', 'є'],
  ['iu', 'ю'],
  ['ia', 'я'],
  ['ii', 'ій'],
  ['yi', 'ий'],
]);

const specialCasesBeginning = new Map<string, string>([
  ['Ye', 'Є'],
  ['Yi', 'Ї'],
  ['Yu', 'Ю'],
  ['Ya', 'Я'],
  ['ye', 'є'],
  ['yi', 'ї'],
  ['yu', 'ю'],
  ['ya', 'я'],
]);

export default function transliterateIntoUkrainian(input: string): string {
  if (!input) {
    return input;
  }

  // Check if input is in Cyrillic script
  if (/[\u{400}-\u{4FF}]/u.test(input)) {
    return input;
  }

  let result = input;

  // Handle special cases at the beginning of the word
  for (const [latin, cyrillic] of specialCasesBeginning) {
    const regex = new RegExp(String.raw`\b${latin}`, 'g');
    // eslint-disable-next-line unicorn/no-unsafe-string-replacement
    result = result.replace(regex, cyrillic);
  }

  // Handle digraphs
  for (const [latin, cyrillic] of digraphsMap) {
    // eslint-disable-next-line unicorn/no-unsafe-string-replacement
    result = result.replaceAll(latin, cyrillic);
  }

  // Transliterate remaining Latin script to Ukrainian Cyrillic script
  return result

    .split('')
    .map((char) => monographsMap.get(char) ?? char)
    .join('');
}
