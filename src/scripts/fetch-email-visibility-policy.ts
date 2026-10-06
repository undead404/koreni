import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  type EmailVisibilityPolicyManifest,
  emailVisibilityPolicyManifestSchema,
  emailVisibilityPolicyResponseSchema,
} from '../app/account/schemata';

const manifestPath = path.join(process.cwd(), '.email-visibility-policy.json');

function normalizeEmails(emails: string[]): string[] {
  return [...new Set(emails.map((email) => email.trim().toLowerCase()))];
}

export async function fetchEmailVisibilityPolicy(): Promise<void> {
  let policy: EmailVisibilityPolicyManifest = { mode: 'all' };

  try {
    const apiSite = process.env.NEXT_PUBLIC_API_SITE;
    const token = process.env.EMAIL_VISIBILITY_SYNC_TOKEN;
    if (!apiSite || !token) {
      throw new Error('Policy endpoint configuration unavailable');
    }

    const response = await fetch(
      new URL('/api/internal/email-visibility-policy', apiSite),
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      throw new Error(`Policy request failed with HTTP ${response.status}`);
    }

    const data: unknown = await response.json();
    const parsed = emailVisibilityPolicyResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Policy response schema mismatch');
    }
    const parsedPolicy = emailVisibilityPolicyManifestSchema.safeParse({
      mode: 'listed',
      suppressed_emails: normalizeEmails(parsed.data.suppressed_emails),
    });
    if (!parsedPolicy.success) {
      throw new Error('Policy response schema mismatch');
    }
    policy = parsedPolicy.data;
  } catch {
    console.error(
      'Email visibility policy fetch failed; writing fail-closed policy.',
    );
  }

  const validatedPolicy = emailVisibilityPolicyManifestSchema.parse(policy);
  await writeFile(manifestPath, `${JSON.stringify(validatedPolicy)}\n`, 'utf8');
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  try {
    await fetchEmailVisibilityPolicy();
  } catch {
    console.error('Email visibility policy manifest could not be written.');
    process.exitCode = 1;
  }
}
