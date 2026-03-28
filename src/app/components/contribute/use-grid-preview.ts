import posthog from 'posthog-js';
import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_PREVIEW_SIZE, EXPAND_STEP } from './constants';

export function useGridPreview(dataRows: Record<string, unknown>[]) {
  const [numberOfRowsShownAbove, setNumberOfRowsShownAbove] =
    useState(DEFAULT_PREVIEW_SIZE);
  const [numberOfRowsShownBelow, setNumberOfRowsShownBelow] =
    useState(DEFAULT_PREVIEW_SIZE);

  const { topRows, bottomRows, hiddenCount } = useMemo(() => {
    if (
      dataRows.length <=
      numberOfRowsShownAbove + numberOfRowsShownBelow + 1
    ) {
      return {
        topRows: dataRows,
        bottomRows: [] as Record<string, unknown>[],
        hiddenCount: 0,
      };
    }
    return {
      topRows: dataRows.slice(0, numberOfRowsShownAbove),
      bottomRows: dataRows.slice(dataRows.length - numberOfRowsShownBelow),
      hiddenCount:
        dataRows.length - numberOfRowsShownAbove - numberOfRowsShownBelow,
    };
  }, [dataRows, numberOfRowsShownAbove, numberOfRowsShownBelow]);

  const expandTop = useCallback(() => {
    posthog.capture('grid_preview_expand_top');
    setNumberOfRowsShownAbove((previous) => previous + EXPAND_STEP);
  }, []);

  const expandBottom = useCallback(() => {
    posthog.capture('grid_preview_expand_bottom');
    setNumberOfRowsShownBelow((previous) => previous + EXPAND_STEP);
  }, []);

  return {
    topRows,
    bottomRows,
    hiddenCount,
    expandTop,
    expandBottom,
  };
}
