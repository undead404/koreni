export default function calculatePayloadSizeInBytes(payload: unknown): number {
  const payloadString = JSON.stringify(payload);
  return new TextEncoder().encode(payloadString).length;
}
