'use client';
import type { ComponentType } from 'react';

import useNoRussians from '../hooks/use-no-russians';

const withoutRussians = <P extends object>(
  WrappedComponent: ComponentType<P>,
) => {
  return function ErrorBoundaryWrapper(properties: P) {
    useNoRussians();
    return <WrappedComponent {...properties} />;
  };
};

export default withoutRussians;
