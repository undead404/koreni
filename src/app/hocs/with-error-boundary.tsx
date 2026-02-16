import React, { type ComponentType, type ReactNode } from 'react';

import { initBugsnag } from '../services/bugsnag';

const ErrorBoundary = initBugsnag().isStarted()
  ? initBugsnag().getPlugin('react')!.createErrorBoundary(React)
  : ({ children }: { children: ReactNode }) => children;

const withErrorBoundary = <P extends object>(
  WrappedComponent: ComponentType<P>,
) => {
  return function ErrorBoundaryWrapper(properties: P) {
    return (
      <ErrorBoundary>
        <WrappedComponent {...properties} />
      </ErrorBoundary>
    );
  };
};

export default withErrorBoundary;
