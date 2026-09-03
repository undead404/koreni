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

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchConsentedEmails(
  config: KarmaPushConfig,
): Promise<Set<string>> {
  const response = await fetch(
    `${config.koreniServerUrl}/api/karma/linked-users`,
    {
      headers: { Authorization: `Bearer ${config.internalToken}` },
    },
  );
  const data = karmaLinkedUsersResponseSchema.parse(await readJson(response));
  return new Set(data.users.map(({ email }) => email.toLowerCase().trim()));
}

export async function pushKarmaSync(
  config: KarmaPushConfig,
): Promise<NavigatorIngestResponse> {
  const consentedEmails = await fetchConsentedEmails(config);
  const contributions = await calculateKarmaContributions();
  const payload = navigatorIngestPayloadSchema.parse({
    accounts: [...contributions]
      .filter(([login]) => consentedEmails.has(login))
      .map(([login, total]) => ({ login, total })),
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
  console.log(result);
  process.stdout.write(
    `Karma sync complete: synced=${result.synced}, awarded=${result.awarded}, unknown=${result.unknown.length}\n`,
  );
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  await runKarmaPush();
}
