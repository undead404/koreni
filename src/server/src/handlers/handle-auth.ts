import type { Context } from 'hono';

import environment from '../environment.js';

const handleAuth = (c: Context) => {
  if (!environment.GITHUB_OAUTH_CLIENT_ID) {
    return c.json({ error: 'GitHub OAuth Client ID is not configured' }, 500);
  }
  const url = `https://github.com/login/oauth/authorize?client_id=${environment.GITHUB_OAUTH_CLIENT_ID}&scope=repo,user`;
  return c.redirect(url);
};

export default handleAuth;
