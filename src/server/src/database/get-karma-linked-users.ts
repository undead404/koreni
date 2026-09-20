import database from './client.js';

export default async function getKarmaLinkedUsers() {
  const users = await database
    .selectFrom('users')
    .select(['email', 'contribution_email', 'karma_linked_at'])
    .where('karma_linked_at', 'is not', null)
    .execute();

  return users.map(({ contribution_email, email, karma_linked_at }) => ({
    contribution_email: contribution_email?.trim().toLowerCase() ?? null,
    email: email.trim().toLowerCase(),
    karma_linked_at,
  }));
}
