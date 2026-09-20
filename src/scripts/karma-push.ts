import { pathToFileURL } from 'node:url';

import {
  karmaLinkedUsersResponseSchema,
  navigatorIngestPayloadSchema,
  type NavigatorIngestResponse,
  navigatorIngestResponseSchema,
} from '../server/src/schemata.js';
import { calculateKarmaContributions } from '../services/karma-calculator.js';

import environment from './environment.js';

export interface KarmaPushConfig {
  appToken: string;
  internalToken: string;
  koreniServerUrl: string;
  navigatorBaseUrl: string;
}

interface ConsentedUser {
  contributionEmail: string;
  email: string;
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchConsentedEmails(
  config: KarmaPushConfig,
): Promise<ConsentedUser[]> {
  const response = await fetch(
    `${config.koreniServerUrl}/api/karma/linked-users`,
    {
      headers: { Authorization: `Bearer ${config.internalToken}` },
    },
  );
  const data = karmaLinkedUsersResponseSchema.parse(await readJson(response));
  return data.users.map(({ contribution_email, email }) => ({
    contributionEmail: (contribution_email ?? email).toLowerCase().trim(),
    email: email.toLowerCase().trim(),
  }));
}

export async function pushKarmaSync(
  config: KarmaPushConfig,
): Promise<NavigatorIngestResponse> {
  const consentedUsers = await fetchConsentedEmails(config);
  const contributions = await calculateKarmaContributions();
  const payload = navigatorIngestPayloadSchema.parse({
    accounts: consentedUsers.map(({ contributionEmail, email }) => ({
      login: email,
      total: contributions.get(contributionEmail) ?? 0,
    })),
  });

  const response = await fetch(`${config.navigatorBaseUrl}/api/karma/ingest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.appToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return navigatorIngestResponseSchema.parse(await readJson(response));
}

export async function runKarmaPush(): Promise<void> {
  const result = await pushKarmaSync(environment);
  process.stdout.write(
    `Karma sync complete: synced=${result.synced}, awarded=${result.awarded}, unknown=${result.unknown.length}\n`,
  );
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  await runKarmaPush();
}
