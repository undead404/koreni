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

  // The CMS expects a postMessage to the opener window
  const content = `<!DOCTYPE html>
<html>
  <head><title>Успіх авторизації GitHub</title></head>
  <body>
  <div id="status" style="font-family:sans-serif;text-align:center;margin-top:50px;">
    <h2>Авторизація...</h2>
  </div>
  <script nonce="${nonce}">
  (function() {
      const data = ${JSON.stringify(data)};
      const message = 'authorization:github:success:' + JSON.stringify(data);
      const targetOrigin = "${environment.NEXT_PUBLIC_SITE}";

      // 1. Standard Popup Flow
      if (window.opener) {
        window.opener.postMessage("authorizing:github", "*");
        window.opener.postMessage(message, targetOrigin);
      } 
      
      // 2. Tab-fix Bridge
      const channel = new BroadcastChannel('static-cms-auth');
      channel.postMessage({ type: 'auth-success', data: message });
      
      // Fix: Check if element exists before setting innerHTML
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.innerHTML = '<h2>Авторизація успішна!</h2><p>Ця вкладка зараз закриється...</p>';
      }
                                
      setTimeout(() => window.close(), 1000);
    })()
    </script>
  </body>
</html>`;
  response.set('Content-Type', 'text/html');
  return response.send(content);
};

export default handleCallback;
