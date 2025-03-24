import type { WebSocket } from '@fastify/websocket';

import type { SearchRequest } from './request';

const requestQueue: {
  conn: WebSocket;
  request: SearchRequest;
}[] = [];

export default requestQueue;
