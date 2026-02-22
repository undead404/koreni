import crypto from 'node:crypto';

import type { RequestHandler } from 'express';
import { z } from 'zod';

import environment from '../environment';
import { nonEmptyString } from '../schemata';

const querySchema = z.object({
  code: nonEmptyString,
});

const githubResponseSchema = z.object({
  access_token: nonEmptyString,
  token_type: nonEmptyString,
  scope: nonEmptyString,
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

  const githubResponse = await oauthTokenResponse.json();
  const githubData = githubResponseSchema.parse(githubResponse);

  const data = {
    token: githubData.access_token,
    access_token: githubData.access_token, // keep both to be safe
    token_type: githubData.token_type,
    scope: githubData.scope,
  };

  const nonce = crypto.randomBytes(16).toString('base64');

  // Set the CSP header specifically for this response
  response.setHeader(
    'Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}'`,
  );

  // The CMS expects a postMessage to the opener window
  const content = `<!DOCTYPE html>
<html>
<head><title>Авторизація</title></head>
<body style="font-family:sans-serif; text-align:center; padding-top:50px;">
  <h2>Авторизація успішна</h2>
  <p>Натисніть кнопку нижче, щоб завершити вхід:</p>
  <button id="finish" style="padding:10px 20px; font-size:1.2em; cursor:pointer;">
    Завершити та закрити
  </button>

  <script nonce="${nonce}">
    (function() {
    try {
      const data = ${JSON.stringify(data)};
      const message = 'authorization:github:success:' + JSON.stringify(data);
      const KEY = 'static-cms-auth-bridge';

      console.log("Attempting to set LocalStorage...");
      localStorage.setItem(KEY, message);

      // BroadcastChannel Fallback
      const channel = new BroadcastChannel('static-cms-auth');
      channel.postMessage({ type: 'auth-success', data: message });

      window.close();
    } catch (e) {
      alert("CRITICAL ERROR: " + e.message);
      console.error(e);
    }
  })()
  </script>
</body>
</html>`;
  response.set('Content-Type', 'text/html');
  return response.send(content);
};

export default handleCallback;
