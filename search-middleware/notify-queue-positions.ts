import requestQueue from './queue';

export default function notifyQueuePositions() {
  for (const [index, item] of requestQueue.entries()) {
    item.conn.send(JSON.stringify({ position: index + 1 }));
  }
}
