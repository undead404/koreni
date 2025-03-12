import * as dotenv from 'dotenv';
dotenv.config();

export const DATA_DIR = './typesense';
export const TYPESENSE_PORT = 8107;

export const RU_COLLECTION_CONFIGURATION = {
  name: 'unstructured_ru',
  enable_nested_fields: true,
  fields: [
    {
      dynamic: true,
      locale: 'ru',
      name: 'data',
      optional: false,
      type: 'object',
    },
    { name: 'location', type: 'geopoint' },
    { facet: true, name: 'tableId', type: 'string' },
    { facet: true, name: 'year', type: 'int32' },
  ],
};

export const UK_COLLECTION_CONFIGURATION = {
  name: 'unstructured_uk',
  enable_nested_fields: true,
  fields: [
    {
      dynamic: true,
      locale: 'uk',
      name: 'data',
      optional: false,
      type: 'object',
    },
    { name: 'location', type: 'geopoint' },
    { facet: true, name: 'tableId', type: 'string' },
    { facet: true, name: 'year', type: 'int32' },
  ],
};
