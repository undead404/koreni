import type { ComponentType } from 'react';

import withErrorBoundary from './with-error-boundary';
import withoutRussians from './without-russians';

const withProviders = <P extends object>(
  WrappedComponent: ComponentType<P>,
) => {
  return withErrorBoundary(withoutRussians(WrappedComponent));
};

export default withProviders;
