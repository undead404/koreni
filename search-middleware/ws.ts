import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import _ from 'lodash';

import notifyQueuePositions from './notify-queue-positions';
import processQueue from './process-queue';
import requestQueue from './queue';
import { searchRequestSchema } from './request';

const handleWs = (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
  done: (error?: Error) => void,
) => {
  fastify.route({
    method: 'GET',
    url: '/ws',
    handler: (request, reply) => {
      reply.send({ hello: 'world' });
    },
    wsHandler: (conn) => {
      conn.on('message', (message) => {
        const request = searchRequestSchema.parse(
          JSON.parse(_.toString(message)),
        );
        requestQueue.push({ request, conn });
        notifyQueuePositions();
        void processQueue();
      });
    },
  });
  done();
};

export default handleWs;
