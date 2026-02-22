import crypto from 'node:crypto';

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
  const nonce = crypto.randomBytes(16).toString('base64');

  // Set the CSP header specifically for this response
  response.setHeader(
    'Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}'`,
  );
  response.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // Also ensure your CSP allows the script to run
  response.setHeader(
    'Content-Security-Policy',
    "script-src 'self' 'unsafe-inline'",
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
    const data = ${JSON.stringify(data)};
    const message = 'authorization:github:success:' + JSON.stringify(data);

    document.getElementById('finish').addEventListener('click', () => {
      // 1. Write to LocalStorage (triggers 'storage' event in the dashboard tab)
      localStorage.setItem('static-cms-auth-bridge', message);
      
      // 2. Standard popup fallback
      if (window.opener) {
        window.opener.postMessage("authorizing:github", "*");
        window.opener.postMessage(message, "https://koreni.org.ua");
      }

      // 3. Close the tab (now permitted because of the click)
      setTimeout(() => window.close(), 500);
    });
  </script>
</body>
</html>`;
  response.set('Content-Type', 'text/html');
  return response.send(content);
};

export default handleCallback;
