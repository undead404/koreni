export default function extractEmails(text: string): string[] {
  const matches = text.matchAll(/<[\w.+-]+@[\w-]+\.[\w.-]+>/g);
  return [...matches].map((match) => match[0]);
}
