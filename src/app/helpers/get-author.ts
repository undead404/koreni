export interface SimplePerson {
  '@type': 'Person';
  name: string;
}

export default function getAuthor(input: {
  authorName?: string;
  authorEmail?: string;
}): SimplePerson | null {
  if (!input.authorName) return null;
  const person: SimplePerson = {
    '@type': 'Person',
    name: input.authorName,
  };

  return person;
}
