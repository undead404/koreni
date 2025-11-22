export interface SimplePerson {
  '@type': 'Person';
  name: string;
  email?: string;
}

const CACHE = new Map<string, SimplePerson | null>();

export default function parsePerson(input: string): SimplePerson | null {
  if (!input) return null;
  if (CACHE.has(input)) return CACHE.get(input)!;
  const match = input.match(
    /^\s*([^<\s][^<]+)(?: <([^<>@]+@[^.<>@][^<>@][^.<>@]*\.[^<>@]+)>)?$/,
  );
  if (match) {
    const person: SimplePerson = {
      '@type': 'Person',
      name: match[1].trim(),
      email: 'mailto:' + match[2]?.trim(),
    };
    CACHE.set(input, person);
    return person;
  }
  const person: SimplePerson = {
    '@type': 'Person',
    name: input.trim(),
  };
  CACHE.set(input, person);
  return person;
}
