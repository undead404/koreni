const latinToCyrillicMap = new Map<string, string>([
  ['a', 'а'],
  ['b', 'б'],
  ['c', 'к'],
  ['d', 'д'],
  ['e', 'е'],
  ['f', 'ф'],
  ['g', 'г'],
  ['h', 'х'],
  ['i', 'и'],
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
  ['y', 'ы'],
  ['z', 'з'],
  ['A', 'А'],
  ['B', 'Б'],
  ['C', 'Ц'],
  ['D', 'Д'],
  ['E', 'Е'],
  ['F', 'Ф'],
  ['G', 'Г'],
  ['H', 'Х'],
  ['I', 'И'],
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
  ['Y', 'Ы'],
  ['Z', 'З'],
]);

const digraphsMap = new Map<string, string>([
  ['Shch', 'Щ'],
  ['Ph', 'Ф'],
  ['Zh', 'Ж'],
  ['Ch', 'Ч'],
  ['Sh', 'Ш'],
  ['Yu', 'Ю'],
  ['Ya', 'Я'],
  ['shch', 'щ'],
  ['ph', 'ф'],
  ['zh', 'ж'],
  ['ch', 'ч'],
  ['sh', 'ш'],
  ['yu', 'ю'],
  ['ya', 'я'],
  ['yo', 'ё'],
  ['ia', 'я'],
  ['ie', 'е'],
  ['iu', 'ю'],
  ['ey', 'ей'],
]);

export default function transliterateIntoRussian(input: string): string {
  if (!input) {
    return input;
  }

  // Check if input is in Cyrillic script
  if (/[\u0400-\u04FF]/.test(input)) {
    return input;
  }

  // Handle digraphs
  let result = input;
  for (const [latin, cyrillic] of digraphsMap.entries()) {
    result = result.replaceAll(latin, cyrillic);
  }

  // Transliterate remaining Latin script to Russian Cyrillic script
  return result.replaceAll(
    /[A-Z]/gi,
    (char) => latinToCyrillicMap.get(char) || char,
  );
}
