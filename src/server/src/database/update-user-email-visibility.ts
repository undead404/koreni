import database from './client.js';

export default async function setUserEmailVisibility(
  userId: string,
  shouldShowEmail: boolean,
): Promise<bigint> {
  const result = await database
    .updateTable('users')
    .set({ show_email: shouldShowEmail ? 1 : 0 })
    .where('id', '=', userId)
    .executeTakeFirst();

  return result.numUpdatedRows;
}
