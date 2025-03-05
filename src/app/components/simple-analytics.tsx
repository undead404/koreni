const SCRIPT_SOURCE =
  process.env.NODE_ENV === 'production'
    ? 'https://scripts.simpleanalyticscdn.com/latest.js'
    : 'https://scripts.simpleanalyticscdn.com/latest.dev.js';

export default function SimpleAnalytics() {
  return (
    <>
      <script async src={SCRIPT_SOURCE}></script>
      <noscript>
        <img
          alt=""
          referrerPolicy="no-referrer-when-downgrade"
          src="https://queue.simpleanalyticscdn.com/noscript.gif"
        />
      </noscript>
    </>
  );
}
