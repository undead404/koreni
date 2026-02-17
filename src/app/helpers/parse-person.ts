export interface SimplePerson {
  '@type': 'Person';
  name: string;
  email?: string;
}

const CACHE = new Map<string, SimplePerson | null>();

export default function parsePerson(input: string): SimplePerson | null {
  if (!input) return null;
  const cached = CACHE.get(input);
  if (cached) return cached;

  const match = input.match(
    /^\s*([^<\s][^<]+)(?: <([\w.+-]+@[\w-]+\.[\w.-]+)>)?$/,
  );

  let person: SimplePerson;
  if (match) {
    const name = match[1].trim();
    const email = match[2]?.trim();
    person = {
      '@type': 'Person',
      name,
      ...(email ? { email: `mailto:${email}` } : {}),
    };
  } else {
    person = {
      '@type': 'Person',
      name: input.trim(),
    };
  }

  CACHE.set(input, person);
  return person;
}
