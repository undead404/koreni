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
  const content = `<script nonce="${nonce}">
  (function() {
    const data = ${JSON.stringify(data)};
    const message = 'authorization:github:success:' + JSON.stringify(data);
    
    // 1. Standard approach (Popups)
    if (window.opener) {
      window.opener.postMessage("authorizing:github", "*");
      window.opener.postMessage(message, window.location.origin);
      setTimeout(() => window.close(), 200);
    } 
    
    // 2. Tab-fix approach (BroadcastChannel)
    const channel = new BroadcastChannel('static-cms-auth');
    channel.postMessage({ type: 'auth-success', data: message });
    
    // UI feedback so the user knows it worked
    document.body.innerHTML = '<div style="font-family:sans-serif;text-align:center;margin-top:50px;">' +
                              '<h2>Авторизація успішна!</h2>' +
                              '<p>Ця вкладка зараз закриється...</p></div>';
                              
    setTimeout(() => window.close(), 1000);
  })()
</script>`;
  response.set('Content-Type', 'text/html');
  return response.send(content);
};

export default handleCallback;
