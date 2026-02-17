'use client';
import React, { type ReactNode } from 'react';

import { initBugsnag } from '../services/bugsnag';

const stub: React.FC<{ children: ReactNode }> = ({ children }) => children;

const ErrorBoundary =
  (initBugsnag().isStarted()
    ? initBugsnag().getPlugin('react')?.createErrorBoundary(React)
    : stub) ?? stub;
export default ErrorBoundary;
