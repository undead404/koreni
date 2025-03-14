import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';

import environment from '../environment';

const ActiveBugsnag = Bugsnag;

if (environment.NEXT_PUBLIC_BUGSNAG_API_KEY) {
  ActiveBugsnag.start({
    apiKey: environment.NEXT_PUBLIC_BUGSNAG_API_KEY,
    autoTrackSessions: false,
    collectUserIp: false,
    generateAnonymousId: false,
    plugins: [new BugsnagPluginReact()],
  });
} else {
  console.warn('Bugsnag API key is missing');
}
export default ActiveBugsnag;
