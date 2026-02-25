import http from 'node:http';

import Typesense from 'typesense';
import type { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration.js';

import environment from './environment.js';

const hostUrl = new URL(environment.NEXT_PUBLIC_TYPESENSE_HOST);

const options: ConfigurationOptions = {
  apiKey: environment.TYPESENSE_ADMIN_KEY,
  connectionTimeoutSeconds: 2,
  nodes: [
    {
      host: hostUrl.hostname, // For Typesense Cloud use xxx.a1.typesense.net
      path: hostUrl.pathname.replace(/\/$/, ''),
      port: hostUrl.port ? Number.parseInt(hostUrl.port) : 443, // For Typesense Cloud use 443
      protocol: hostUrl.protocol.slice(0, -1), // For Typesense Cloud use https
    },
  ],
};

if (hostUrl.hostname === 'localhost') {
  options.httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
}

const typesense = new Typesense.Client(options);

export default typesense;
