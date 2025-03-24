import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import { fastifyWebsocket } from '@fastify/websocket';
import { fastify as Fastify } from 'fastify';

import handleWs from './ws';

const fastify = Fastify({ logger: true });
fastify.register(fastifyWebsocket);
fastify.register(fastifyCors, {
  origin: '*',
});
fastify.register(fastifyCompress, {
  global: false,
  encodings: ['gzip', 'deflate'],
  threshold: 1024,
  zlibOptions: {
    level: 6,
  },
});

fastify.register(handleWs);

export default fastify;
