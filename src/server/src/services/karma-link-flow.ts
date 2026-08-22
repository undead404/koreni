import { linkUserKarma } from '../database/link-user-karma.js';

import { getUserKarmaContribution } from './karma-calculator.js';
import { navigatorClient } from './navigator-client.js';

export interface ExecuteUserAccountLinkParameters {
  code: string;
  email: string;
  userId: string;
}

export interface ExecuteUserAccountLinkResult {
  awarded: number;
  ok: true;
}

export async function executeUserAccountLink({
  code,
  email,
  userId,
}: ExecuteUserAccountLinkParameters): Promise<ExecuteUserAccountLinkResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const calculatedTotal = await getUserKarmaContribution(normalizedEmail);

  const redeemResult = await navigatorClient.redeemLinkCode({
    code,
    login: normalizedEmail,
    total: calculatedTotal,
  });

  const timestamp = new Date().toISOString();
  await linkUserKarma(userId, timestamp);

  return {
    ok: true,
    awarded: redeemResult.awarded,
  };
}
