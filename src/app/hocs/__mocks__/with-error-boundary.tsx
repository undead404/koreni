import React from 'react';

const withErrorBoundaryMock = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
) => {
  return WrappedComponent;
};

export default withErrorBoundaryMock;
