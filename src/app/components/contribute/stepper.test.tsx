import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useContributionStateStore } from './contribution-state';
import getDefaultValues from './default-values';
import type { ContributeFormStepProperties } from './step';
import ContributeFormStepper from './stepper';
import type { ContributeFormValues } from './types';

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock('./step', () => ({
  default: (properties: ContributeFormStepProperties) => (
    <div
      data-testid={`step-${properties.index}`}
      data-status={properties.status}
      data-is-last={String(properties.isLast)}
      data-stage={properties.isLast ? properties.stage : undefined}
      data-has-stage={String('stage' in properties)}
      data-has-widget={String('turnstileWidget' in properties)}
    >
      {properties.isLast ? properties.turnstileWidget : null}
    </div>
  ),
}));

vi.mock('./success-panel', () => ({
  default: ({ prUrl }: { prUrl: string }) => (
    <div data-testid="success-panel">{prUrl}</div>
  ),
}));

vi.mock('./table-state', () => ({
  useTableStateStore: () => ({ tableFileName: 'contribution.csv' }),
}));

interface FormHarnessProperties {
  children: ReactNode;
}

function FormHarness({ children }: FormHarnessProperties) {
  const methods = useForm<ContributeFormValues>({
    defaultValues: getDefaultValues(),
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

function prepareStepperState(prUrl = '') {
  useContributionStateStore.getState().resetState();
  useContributionStateStore.getState().setActiveIndex(4);
  useContributionStateStore.getState().setState({
    prUrl,
    stage: 'verification',
  });
}

describe('ContributeFormStepper Turnstile slot', () => {
  beforeEach(() => {
    prepareStepperState();
  });

  afterEach(() => {
    cleanup();
    useContributionStateStore.getState().resetState();
  });

  it('passes the widget and submission stage to the active final step only', () => {
    const widget: ReactNode = (
      <span data-testid="turnstile-placeholder">Turnstile</span>
    );

    render(
      <FormHarness>
        <ContributeFormStepper stage="verification" turnstileWidget={widget} />
      </FormHarness>,
    );

    expect(
      screen.getAllByTestId(/^step-/).map((step) => step.dataset.testid),
    ).toStrictEqual(['step-0', 'step-1', 'step-2', 'step-3', 'step-4']);

    for (const index of [0, 1, 2, 3]) {
      const step = screen.getByTestId(`step-${index}`);
      expect(step).toHaveAttribute('data-has-stage', 'false');
      expect(step).toHaveAttribute('data-has-widget', 'false');
    }

    const finalStep = screen.getByTestId('step-4');
    expect(finalStep).toHaveAttribute('data-status', 'active');
    expect(finalStep).toHaveAttribute('data-is-last', 'true');
    expect(finalStep).toHaveAttribute('data-stage', 'verification');
    expect(finalStep).toHaveAttribute('data-has-stage', 'true');
    expect(finalStep).toHaveAttribute('data-has-widget', 'true');
    expect(screen.getByTestId('turnstile-placeholder')).toBeInTheDocument();
  });

  it('omits the widget after prUrl marks the contribution complete', () => {
    prepareStepperState('https://github.com/koreni/koreni/pull/123');

    render(
      <FormHarness>
        <ContributeFormStepper
          stage="idle"
          turnstileWidget={
            <span data-testid="turnstile-placeholder">Turnstile</span>
          }
        />
      </FormHarness>,
    );

    for (let index = 0; index < 5; index += 1) {
      const step = screen.getByTestId(`step-${index}`);
      expect(step).toHaveAttribute('data-status', 'completed');
      expect(step).toHaveAttribute('data-has-stage', 'false');
      expect(step).toHaveAttribute('data-has-widget', 'false');
    }

    expect(
      screen.queryByTestId('turnstile-placeholder'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('success-panel')).toHaveTextContent(
      'https://github.com/koreni/koreni/pull/123',
    );
  });
});
