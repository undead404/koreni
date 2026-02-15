import environment from '../environment';

import posthog from './posthog';

export default async function submitToGithub(data: unknown, ip: string) {
  const githubResponse = await fetch(
    `https://api.github.com/repos/${environment.GITHUB_REPO}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${environment.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Koreni-API-Server',
      },
      body: JSON.stringify({
        event_type: 'import_data',
        client_payload: data,
      }),
    },
  );

  if (!githubResponse.ok) {
    const errorText = await githubResponse.text();
    console.error('GitHub API Error:', errorText);
    posthog.capture({
      distinctId: ip,
      event: 'github_api_error',
      properties: {
        status: githubResponse.status,
        statusText: githubResponse.statusText,
        response: errorText,
      },
    });
    throw new Error(`GitHub API Error: ${errorText}`);
  }
}
