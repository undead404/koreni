import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SubmissionStage } from './contribution-state';
import getDefaultValues from './default-values';
import ContributeFormStep from './step';
import type { ContributeFormValues, StepDefinition } from './types';

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

const finalStep: StepDefinition = {
  fields: [],
  icon: null,
  label: 'Перевірити введені дані',
  placeholderBody: 'Перевірте введені дані.',
  placeholderTitle: 'Перевірити й подати',
  summary: 'Таблиця пройшла первинну перевірку',
};

interface FormHarnessProperties {
  children: ReactNode;
  onValidSubmit?: () => Promise<void>;
}

function FormHarness({
  children,
  onValidSubmit = () => Promise.resolve(),
}: FormHarnessProperties) {
  const methods = useForm<ContributeFormValues>({
    defaultValues: getDefaultValues(),
  });
  const handleSubmit = methods.handleSubmit(onValidSubmit);

  return (
    <FormProvider {...methods}>
      <form
        data-testid="test-form"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        {children}
      </form>
    </FormProvider>
  );
}

const stageCases: [SubmissionStage, string, string][] = [
  ['verification', 'Перевірка на людяність…', 'Перевіряємо…'],
  ['conversion', 'Перевірку пройдено — готуємо дані…', 'Готуємо дані…'],
  ['transmission', 'Перевірку пройдено — надсилаємо дані…', 'Надсилаємо…'],
];

afterEach(cleanup);

function renderFinalStep(stage: SubmissionStage) {
  return render(
    <FormHarness>
      <ContributeFormStep
        def={finalStep}
        index={4}
        status="active"
        isLast
        onActivate={vi.fn()}
        onContinue={vi.fn()}
        onBack={vi.fn()}
        nextConnectorStatus="hidden"
        stage={stage}
        turnstileWidget={
          <span data-testid="turnstile-placeholder">Widget</span>
        }
      />
    </FormHarness>,
  );
}

describe('ContributeFormStep submission action', () => {
  it.each(stageCases)(
    'orders the action elements and announces the %s stage',
    async (stage, statusText, buttonLabel) => {
      const { promise: pendingSubmission, resolve: finishSubmission } =
        Promise.withResolvers<undefined>();

      render(
        <FormHarness onValidSubmit={() => pendingSubmission}>
          <ContributeFormStep
            def={finalStep}
            index={4}
            status="active"
            isLast
            onActivate={vi.fn()}
            onContinue={vi.fn()}
            onBack={vi.fn()}
            nextConnectorStatus="hidden"
            stage={stage}
            turnstileWidget={
              <span data-testid="turnstile-placeholder">Widget</span>
            }
          />
        </FormHarness>,
      );

      const submitButton = screen.getByRole('button', { name: 'Подати' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(statusText);
        expect(
          screen.getByRole('button', { name: buttonLabel }),
        ).toBeDisabled();
      });

      const actionGroup = screen.getByTestId('submission-group');
      const actionChildren =
        actionGroup.querySelectorAll<HTMLElement>(':scope > *');
      expect(
        [...actionChildren].map((child) => child.dataset.testid ?? null),
      ).toStrictEqual([
        'submission-instruction',
        null,
        'turnstile-widget',
        null,
      ]);
      expect(screen.getByTestId('submission-instruction')).toHaveTextContent(
        'Натисніть «Подати», щоб запустити перевірку та надіслати дані. Відправлення підтвердимо окремо.',
      );
      expect(screen.getByTestId('turnstile-placeholder')).toBeInTheDocument();

      await act(async () => {
        finishSubmission(undefined);
        await pendingSubmission;
      });
    },
  );

  it('shows no status while idle and keeps the normal submit label', () => {
    renderFinalStep('idle');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Подати' })).toBeEnabled();
    expect(screen.getByTestId('submission-instruction')).toHaveTextContent(
      'Натисніть «Подати», щоб запустити перевірку та надіслати дані. Відправлення підтвердимо окремо.',
    );
  });
});
