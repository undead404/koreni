import type { AxiosInstance } from 'axios';
import { z } from 'zod';

import {
  PL_COLLECTION_CONFIGURATION,
  RU_COLLECTION_CONFIGURATION,
  UK_COLLECTION_CONFIGURATION,
} from './config';

const errorSchema = z.object({
  status: z.number().min(100),
});

export default async function createCollections(
  client: AxiosInstance,
  apiKey: string,
) {
  try {
    await client.post('/collections', PL_COLLECTION_CONFIGURATION, {
      headers: { 'X-TYPESENSE-API-KEY': apiKey },
    });
    console.log(
      `Successfully created ${PL_COLLECTION_CONFIGURATION.name} collection.`,
    );
  } catch (error) {
    if (errorSchema.parse(error).status === 409) {
      console.log('Collection unstructured_pl already exists');
    } else throw error;
  }
  try {
    await client.post('/collections', RU_COLLECTION_CONFIGURATION, {
      headers: { 'X-TYPESENSE-API-KEY': apiKey },
    });
    console.log(
      `Successfully created ${RU_COLLECTION_CONFIGURATION.name} collection.`,
    );
  } catch (error) {
    if (errorSchema.parse(error).status === 409) {
      console.log('Collection unstructured_ru already exists');
    } else throw error;
  }
  try {
    await client.post('/collections', UK_COLLECTION_CONFIGURATION, {
      headers: { 'X-TYPESENSE-API-KEY': apiKey },
    });
    console.log(
      `Successfully created ${UK_COLLECTION_CONFIGURATION.name} collection.`,
    );
  } catch (error) {
    if (errorSchema.parse(error).status === 409) {
      console.log('Collection unstructured_uk already exists');
    } else throw error;
  }
}
