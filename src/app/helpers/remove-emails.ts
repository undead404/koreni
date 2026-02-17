export default function removeEmails(text: string): string {
  return text.replaceAll(/<[\w.+-]+@[\w-]+\.[\w.-]+>/g, '');
}
