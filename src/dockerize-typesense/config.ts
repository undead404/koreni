import * as dotenv from 'dotenv';
dotenv.config();

export const DATA_DIR = './typesense';
export const TYPESENSE_PORT = 8107;

export const PL_COLLECTION_CONFIGURATION = {
  name: 'unstructured_pl',
  enable_nested_fields: true,
  fields: [
    { locale: 'pl', name: 'values', optional: false, type: 'string[]' },
    { name: 'raw', optional: false, type: 'object' },
    { name: 'location', type: 'geopoint' },
    { facet: true, name: 'tableId', type: 'string' },
    { name: 'title', type: 'string' },
    { facet: true, name: 'year', type: 'int32' },
  ],
};

export const RU_COLLECTION_CONFIGURATION = {
  name: 'unstructured_ru',
  enable_nested_fields: true,
  fields: [
    { locale: 'ru', name: 'values', optional: false, type: 'string[]' },
    { name: 'raw', optional: false, type: 'object' },
    { name: 'location', type: 'geopoint' },
    { facet: true, name: 'tableId', type: 'string' },
    { name: 'title', type: 'string' },
    { facet: true, name: 'year', type: 'int32' },
  ],
};

export const UK_COLLECTION_CONFIGURATION = {
  name: 'unstructured_uk',
  enable_nested_fields: true,
  fields: [
    { locale: 'uk', name: 'values', optional: false, type: 'string[]' },
    { name: 'raw', optional: false, type: 'object' },
    { name: 'location', type: 'geopoint' },
    { facet: true, name: 'tableId', type: 'string' },
    { name: 'title', type: 'string' },
    { facet: true, name: 'year', type: 'int32' },
  ],
};
