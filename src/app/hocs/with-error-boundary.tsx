import React from 'react';

import ActiveBugsnag from '../services/bugsnag';

const ErrorBoundary = ActiveBugsnag.isStarted()
  ? ActiveBugsnag.getPlugin('react')!.createErrorBoundary(React)
  : ({ children }: { children: React.ReactNode | undefined }) => children;

const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
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
