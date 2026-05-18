#!/usr/bin/env bash

source .env

curl "$NEXT_PUBLIC_TYPESENSE_HOST/collections" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-TYPESENSE-API-KEY: ${TYPESENSE_ADMIN_KEY}" \
  -d '{
         "name": "unstructured_pl",
         "enable_nested_fields": true,
         "fields": [
           {"name": "location", "type": "geopoint"},
           {"name": "raw", "type": "object", "index": false},
           {"facet": true, "name": "tableId", "type": "string"},
           {"locale": "pl", "name": "values", "type": "string[]"},
           {"facet": true, "name": "year", "type": "int32"}
         ]
       }'

curl "$NEXT_PUBLIC_TYPESENSE_HOST/collections" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-TYPESENSE-API-KEY: ${TYPESENSE_ADMIN_KEY}" \
  -d '{
         "name": "unstructured_ru",
         "enable_nested_fields": true,
         "fields": [
           {"name": "location", "type": "geopoint"},
           {"name": "raw", "type": "object", "index": false},
           {"facet": true, "name": "tableId", "type": "string"},
           {"locale": "ru", "name": "values", "type": "string[]"},
           {"facet": true, "name": "year", "type": "int32"}
         ]
       }'

curl "$NEXT_PUBLIC_TYPESENSE_HOST/collections" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-TYPESENSE-API-KEY: ${TYPESENSE_ADMIN_KEY}" \
  -d '{
         "name": "unstructured_uk",
         "enable_nested_fields": true,
         "fields": [
           {"name": "location", "type": "geopoint"},
           {"name": "raw", "type": "object", "index": false},
           {"facet": true, "name": "tableId", "type": "string"},
           {"locale": "uk", "name": "values", "type": "string[]"},
           {"facet": true, "name": "year", "type": "int32"}
         ]
       }'
