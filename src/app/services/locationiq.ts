import posthog from 'posthog-js';
import { z } from 'zod';

import environment from '../environment';

import { initBugsnag } from './bugsnag';

const locationiqResponseSchema = z.object({
  display_name: z.string(),
});

const options = { method: 'GET', headers: { accept: 'application/json' } };

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
    const geoData = locationiqResponseSchema.parse(data);
    return geoData.display_name;
  } catch (error) {
    initBugsnag().notify(error as Error);
    posthog.captureException(error as Error);
    return;
  }
}
