export interface SimplePerson {
  '@type': 'Person';
  name: string;
  email?: string;
}

export default function getAuthor(input: {
  authorName?: string;
  authorEmail?: string;
}): SimplePerson | null {
  if (!input.authorName) return null;
  const person: SimplePerson = {
    '@type': 'Person',
    email: input.authorEmail ? `mailto:${input.authorEmail}` : undefined,
    name: input.authorName,
  };

  return person;
}
