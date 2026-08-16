import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { ProjectCreatePayload } from '@/server/src/schemata';

import MetadataTab from './metadata-tab';

vi.mock('@/app/components/contribute/sources-input', () => ({
  default: () => <div data-testid="sources-input" />,
}));
vi.mock('@/app/components/contribute/years-input', () => ({
  default: () => <div data-testid="years-input" />,
}));
vi.mock('@/app/components/contribute/spatial-input', () => ({
  SpatialInput: () => <div data-testid="spatial-input" />,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm<ProjectCreatePayload>({
    defaultValues: {
      title: 'Test',
      type: 'table' as any,
      location: [],
      yearsRange: [],
      sources: [],
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('MetadataTab', () => {
  it('renders form fields', () => {
    render(
      <Wrapper>
        <MetadataTab
          schemas={[]}
          onSubmit={vi.fn()}
          isSubmitting={false}
          knownLocations={[]}
        />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Type')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });
});
