import database from './client.js';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export default async function getEmailVisibilitySuppressions(): Promise<
  string[]
> {
  const users = await database
    .selectFrom('users')
    .select(['email', 'contribution_email'])
    .where('show_email', '=', 0)
    .execute();

  const emails = new Set<string>();
  for (const { contribution_email, email } of users) {
    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail) emails.add(normalizedEmail);
    if (contribution_email) {
      const normalizedContributionEmail = normalizeEmail(contribution_email);
      if (normalizedContributionEmail) emails.add(normalizedContributionEmail);
    }
  }

  return [...emails];
}
