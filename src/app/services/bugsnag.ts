import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';

import environment from '../environment';

const ActiveBugsnag = Bugsnag;

let isConsentGiven = false;

// Функція для оновлення статусу згоди
export const setBugsnagConsent = (allowed: boolean) => {
  isConsentGiven = allowed;

  // Якщо згоду дали, і BugSnag вже запущено — можна оновити дані юзера (опціонально)
  if (allowed && Bugsnag.isStarted()) {
    ActiveBugsnag.resumeSession();
  } else if (!allowed && Bugsnag.isStarted()) {
    ActiveBugsnag.pauseSession();
  }
};

export const initBugsnag = () => {
  if (ActiveBugsnag.isStarted()) return ActiveBugsnag;
  if (globalThis.window === undefined) return ActiveBugsnag;
  if (!environment.NEXT_PUBLIC_BUGSNAG_API_KEY) {
    console.warn('Bugsnag API key is missing');
    return ActiveBugsnag;
  }
  ActiveBugsnag.start({
    apiKey: environment.NEXT_PUBLIC_BUGSNAG_API_KEY,
    autoTrackSessions: false,
    collectUserIp: false,
    generateAnonymousId: false,
    onError: () => {
      if (!isConsentGiven) {
        return false; // Блокує відправку помилки
      }
      return true;
    },
    plugins: [new BugsnagPluginReact()],
    releaseStage: process.env.NODE_ENV || 'development',
  });

  return ActiveBugsnag;
};
