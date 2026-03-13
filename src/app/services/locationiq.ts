import _ from 'lodash';
import posthog from 'posthog-js';
import { z } from 'zod';

import environment from '../environment';

import { initBugsnag } from './bugsnag';

const locationiqAutocompleteResponseSchema = z.array(
  z.object({
    display_name: z.string(),
    lat: z.string().transform((value) => Number.parseFloat(value)),
    lon: z.string().transform((value) => Number.parseFloat(value)),
    place_id: z.string(),
  }),
);

const locationiqReverseGeocodeResponseSchema = z.object({
  display_name: z.string(),
});

const errorResponseSchema = z.object({
  error: z.string(),
});

const options = { method: 'GET', headers: { accept: 'application/json' } };

async function autocompleteBounced(
  query: string,
  abortController: AbortController,
) {
  try {
    if (!environment.NEXT_PUBLIC_LOCATIONIQ_KEY) {
      return;
    }
    const response = await fetch(
      `https://us1.locationiq.com/v1/autocomplete?key=${environment.NEXT_PUBLIC_LOCATIONIQ_KEY}&q=${encodeURIComponent(
        query,
      )}&limit=5&format=json`,
      { ...options, signal: abortController.signal },
    );
    if (!response.ok) {
      const errorData = (await response.json()) as unknown;
      const errorResponse = errorResponseSchema.safeParse(errorData);
      if (errorResponse.success) {
        throw new Error(errorResponse.data.error);
      }
      throw new Error(`Невідома помилка: ${JSON.stringify(errorData)}`);
    }

    const data = (await response.json()) as unknown;
    const autocompleteData = locationiqAutocompleteResponseSchema.parse(data);
    return autocompleteData;
  } catch (error) {
    console.error(error);
    initBugsnag().notify(error as Error);
    posthog.captureException(error as Error);
    return;
  }
}

export const autocomplete = _.throttle(autocompleteBounced, 500);

export async function reverseGeocode(coordinates: [number, number]) {
  try {
    if (!environment.NEXT_PUBLIC_LOCATIONIQ_KEY) {
      return;
    }
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse?lat=${coordinates[0]}&lon=${coordinates[1]}&format=json&zoom=14&accept-language=uk&key=${environment.NEXT_PUBLIC_LOCATIONIQ_KEY}`,
      options,
    );
    const data = (await response.json()) as unknown;
    const geoData = locationiqReverseGeocodeResponseSchema.parse(data);
    return geoData.display_name;
  } catch (error) {
    initBugsnag().notify(error as Error);
    posthog.captureException(error as Error);
    return;
  }
}
