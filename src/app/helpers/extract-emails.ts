export default function extractEmails(text: string): string[] {
  const matches = text.matchAll(/<[^<>@]+@[^.<>@][^<>@][^.<>@]*\.[^<>@]+>/g);
  return [...matches].map((match) => match[0]);
}
