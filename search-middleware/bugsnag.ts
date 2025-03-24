import Bugsnag from '@bugsnag/js';

import environment from './environment';

const ActiveBugsnag = Bugsnag;

if (environment.NEXT_PUBLIC_BUGSNAG_API_KEY) {
  ActiveBugsnag.start({
    appType: 'middleware',
    apiKey: environment.NEXT_PUBLIC_BUGSNAG_API_KEY,
    autoTrackSessions: false,
    collectUserIp: false,
    generateAnonymousId: false,
  });
} else {
  console.warn('Bugsnag API key is missing');
}
export default ActiveBugsnag;
