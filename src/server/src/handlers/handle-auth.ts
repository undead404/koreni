import type { RequestHandler } from 'express';

import environment from '../environment';

const handleAuth: RequestHandler = (request, response) => {
  if (!environment.GITHUB_OAUTH_CLIENT_ID) {
    return response
      .status(500)
      .json({ error: 'GitHub OAuth Client ID is not configured' });
  }
  const url = `https://github.com/login/oauth/authorize?client_id=${environment.GITHUB_OAUTH_CLIENT_ID}&scope=repo,user`;
  return response.redirect(url);
};

export default handleAuth;
