import type { NotifiableError } from '@bugsnag/js';
import { z } from 'zod';

import ActiveBugsnag from './bugsnag';
import environment from './environment';
import requestQueue from './queue';

let processing = false;

const errorSchema = z.object({
  message: z.string().min(1),
});
export default async function processQueue() {
  // If already processing or the queue is empty, return
  if (processing || requestQueue.length === 0) return;

  // Mark as processing
  processing = true;
  // Dequeue the next request
  const value = requestQueue.shift();
  if (!value) {
    processing = false;
    return;
  }
  const { conn, request } = value;

  try {
    // Forward the request to Typesense using Fetch API
    const response = await fetch(
      environment.NEXT_PUBLIC_TYPESENSE_HOST +
        '/collections/:collection/documents/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TYPESENSE-API-KEY': 'your-typesense-api-key',
        },
        body: JSON.stringify(request),
      },
    );

    const data = await response.json();
    // Send the response to the client
    conn.send(JSON.stringify({ status: response.status, data }));
  } catch (error) {
    ActiveBugsnag.notify(error as NotifiableError, (event) => {
      event.addMetadata('request', {
        body: request,
      });
      event.addMetadata('response', {
        status: 500,
        data: error,
      });
      return true;
    });
    // Send the error response to the client
    conn.send(
      JSON.stringify({ status: 500, error: errorSchema.parse(error).message }),
    );
  }

  // Mark as not processing
  processing = false;
  // Process the next request in the queue
  if (requestQueue.length > 0) {
    void processQueue();
  }
}
