import Typesense from 'typesense';

export default function getTypesenseClient(apiKey: string, host: string) {
  const hostUrl = new URL(host);

  const client = new Typesense.Client({
    nodes: [
      {
        host: hostUrl.hostname, // For Typesense Cloud use xxx.a1.typesense.net
        path: hostUrl.pathname,
        port: hostUrl.port ? Number.parseInt(hostUrl.port) : 443, // For Typesense Cloud use 443
        protocol: hostUrl.protocol.slice(0, -1), // For Typesense Cloud use https
      },
    ],
    apiKey: apiKey, // Be sure to use an API key that only allows search operations
    connectionTimeoutSeconds: 2,
  });

  return client;
}
