import { linkUserKarma } from '../database/link-user-karma.js';
import { logger } from '../logger.js';

import { getUserKarmaContribution } from './karma-calculator.js';
import { navigatorClient } from './navigator-client.js';

export interface ExecuteUserAccountLinkParameters {
  code: string;
  contributionEmail: string | null;
  email: string;
  userId: string;
}

export interface ExecuteUserAccountLinkResult {
  awarded: number;
  ok: true;
}

export async function executeUserAccountLink({
  code,
  contributionEmail,
  email,
  userId,
}: ExecuteUserAccountLinkParameters): Promise<ExecuteUserAccountLinkResult> {
  const normalizedEmail = (contributionEmail ?? email).toLowerCase().trim();

  const calculatedTotal = await getUserKarmaContribution(normalizedEmail);

  const redeemResult = await navigatorClient.redeemLinkCode({
    code,
    login: normalizedEmail,
    total: calculatedTotal,
  });
  logger.info('domain.karma_link.completed', { userId });

  const timestamp = new Date().toISOString();
  await linkUserKarma(userId, timestamp);

  return {
    ok: true,
    awarded: redeemResult.awarded,
  };
}
