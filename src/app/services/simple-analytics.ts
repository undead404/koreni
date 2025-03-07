declare global {
  interface Window {
    sa_event?: (eventName: string, metadata: Record<string, string>) => void;
  }
}

export default function trackEvent(
  eventName: string,
  metadata: Record<string, string>,
) {
  // eslint-disable-next-line unicorn/prefer-global-this
  const sa_event = window.sa_event;
  if (sa_event) {
    sa_event(eventName, metadata);
  }
}
