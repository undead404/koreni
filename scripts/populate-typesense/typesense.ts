import Typesense from 'typesense';

import environment from './environment.js';

const hostUrl = new URL(environment.TYPESENSE_HOST);

const typesense = new Typesense.Client({
  nodes: [
    {
      host: hostUrl.hostname, // For Typesense Cloud use xxx.a1.typesense.net
      path: hostUrl.pathname,
      port: hostUrl.port ? Number.parseInt(hostUrl.port) : 443, // For Typesense Cloud use 443
      protocol: hostUrl.protocol.slice(0, -1), // For Typesense Cloud use https
    },
  ],
  apiKey: environment.TYPESENSE_ADMIN_KEY,
  connectionTimeoutSeconds: 2,
});

export default typesense;
