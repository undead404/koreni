import type { NotifiableError } from '@bugsnag/js';

import ActiveBugsnag from './bugsnag';
import fastify from './fastify';

const PORT = 3003;
const start = async () => {
  try {
    await fastify.listen({ port: PORT });
    fastify.log.info(
      `Rate limiter proxy listening at http://localhost:${PORT}`,
    );
  } catch (error) {
    ActiveBugsnag.notify(error as NotifiableError, (event) => {
      event.addMetadata('request', {
        body: {},
      });
      event.addMetadata('response', {
        status: 500,
        data: error,
      });
      return true;
    });
    fastify.log.error(error);
    process.exit(1);
  }
};

export default start;
