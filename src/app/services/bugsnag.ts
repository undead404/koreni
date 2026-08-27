import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';

import environment from '../environment';

const ActiveBugsnag = Bugsnag;

let isConsentGiven = false;

// Функція для оновлення статусу згоди
export const setBugsnagConsent = (isAllowed: boolean) => {
  isConsentGiven = isAllowed;

  // Якщо згоду дали, і BugSnag вже запущено — можна оновити дані юзера (опціонально)
  if (isAllowed && Bugsnag.isStarted()) {
    ActiveBugsnag.resumeSession();
  } else if (!isAllowed && Bugsnag.isStarted()) {
    ActiveBugsnag.pauseSession();
  }
};

export const initBugsnag = () => {
  if (ActiveBugsnag.isStarted()) return ActiveBugsnag;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (globalThis.window === undefined) return ActiveBugsnag;
  if (!environment.NEXT_PUBLIC_BUGSNAG_API_KEY) {
    return ActiveBugsnag;
  }
  ActiveBugsnag.start({
    apiKey: environment.NEXT_PUBLIC_BUGSNAG_API_KEY,
    autoTrackSessions: false,
    collectUserIp: false,
    generateAnonymousId: false,
    onError: () => {
      return isConsentGiven; // Блокує відправку помилки
    },
    plugins: [new BugsnagPluginReact()],
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    releaseStage: process.env.NODE_ENV || 'development',
  });

  return ActiveBugsnag;
};
