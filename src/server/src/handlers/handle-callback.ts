import type { RequestHandler } from 'express';
import { z } from 'zod';

import environment from '../environment';
import { nonEmptyString } from '../schemata';

const querySchema = z.object({
  code: nonEmptyString,
});

const handleCallback: RequestHandler = async (request, response) => {
  if (!environment.GITHUB_OAUTH_CLIENT_ID) {
    return response
      .status(500)
      .json({ error: 'GitHub OAuth Client ID is not configured' });
  }
  if (!environment.GITHUB_OAUTH_CLIENT_SECRET) {
    return response
      .status(500)
      .json({ error: 'GitHub OAuth Client Secret is not configured' });
  }

  const CLIENT_ID = environment.GITHUB_OAUTH_CLIENT_ID;
  const CLIENT_SECRET = environment.GITHUB_OAUTH_CLIENT_SECRET;
  const query = querySchema.parse(request.query);

  const code = query.code;

  // Exchange code for access_token
  const oauthTokenResponse = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    },
  );

  const data = await oauthTokenResponse.json();

  // The CMS expects a postMessage to the opener window
  const content = `
    <script>
      (function() {
        function receiveMessage(e) {
          console.log("Sending message...", e.data);
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify(data)}',
            e.origin
          );
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })()
    </script>`;
  response.set('Content-Type', 'text/html');
  return response.send(content);
};

export default handleCallback;
