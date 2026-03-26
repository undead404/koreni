'use client';
import React, { type FC, type ReactNode } from 'react';

import { initBugsnag } from '../services/bugsnag';

const stub: FC<{ children: ReactNode }> = ({ children }) => <>{children}</>;

const getErrorBoundary = () => {
  const bugsnagClient = initBugsnag();
  if (bugsnagClient.isStarted()) {
    const bugsnagPlugin = bugsnagClient.getPlugin('react');
    if (bugsnagPlugin) {
      return bugsnagPlugin.createErrorBoundary(React);
    }
  }
  return stub;
};

const ErrorBoundary = getErrorBoundary();

export default ErrorBoundary;
