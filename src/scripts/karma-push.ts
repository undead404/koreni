import { pathToFileURL } from 'node:url';

import {
  karmaLinkedUsersResponseSchema,
  navigatorIngestPayloadSchema,
  type NavigatorIngestResponse,
  navigatorIngestResponseSchema,
} from '../server/src/schemata.js';
import { calculateKarmaContributions } from '../services/karma-calculator.js';

export interface KarmaPushConfiguration {
  appToken: string;
  internalToken: string;
  koreniServerUrl: string;
  navigatorBaseUrl: string;
}

function getConfiguration(): KarmaPushConfiguration {
  const appToken = process.env.KARMA_APP_TOKEN;
  const internalToken = process.env.KARMA_INTERNAL_TOKEN;
  const koreniServerUrl = process.env.SITE;

  if (!appToken || !internalToken || !koreniServerUrl) {
    throw new Error(
      'KARMA_APP_TOKEN, KARMA_INTERNAL_TOKEN, and SITE are required',
    );
  }

  return {
    appToken,
    internalToken,
    koreniServerUrl: koreniServerUrl.replace(/\/+$/, ''),
    navigatorBaseUrl: (
      process.env.NAVIGATOR_BASE_URL || 'https://www.uagenealogy.com'
    ).replace(/\/+$/, ''),
  };
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchConsentedEmails(
  configuration: KarmaPushConfiguration,
): Promise<Set<string>> {
  const response = await fetch(
    `${configuration.koreniServerUrl}/api/karma/linked-users`,
    {
      headers: { Authorization: `Bearer ${configuration.internalToken}` },
    },
  );
  const data = karmaLinkedUsersResponseSchema.parse(await readJson(response));
  return new Set(data.users.map(({ email }) => email.toLowerCase().trim()));
}

export async function pushKarmaSync(
  configuration: KarmaPushConfiguration,
): Promise<NavigatorIngestResponse> {
  const consentedEmails = await fetchConsentedEmails(configuration);
  const contributions = await calculateKarmaContributions();
  const payload = navigatorIngestPayloadSchema.parse({
    accounts: [...contributions.entries()]
      .filter(([login]) => consentedEmails.has(login))
      .map(([login, total]) => ({ login, total })),
  });

  const response = await fetch(
    `${configuration.navigatorBaseUrl}/api/karma/ingest`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${configuration.appToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  return navigatorIngestResponseSchema.parse(await readJson(response));
}

export async function runKarmaPush(): Promise<void> {
  const result = await pushKarmaSync(getConfiguration());
  process.stdout.write(
    `Karma sync complete: synced=${result.synced}, awarded=${result.awarded}, unknown=${result.unknown.length}\n`,
  );
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  await runKarmaPush();
}
