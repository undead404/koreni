#!/usr/bin/env bash

source .env

curl "$TYPESENSE_HOST/collections" \
       -X POST \
       -H "Content-Type: application/json" \
       -H "X-TYPESENSE-API-KEY: ${TYPESENSE_ADMIN_KEY}" \
       -d '{
         "name": "unstructured_ru",
         "enable_nested_fields": true,
         "fields": [
           {"dynamic": true, "locale": "ru", "name": "data", "optional": false, "type": "object"},
           {"name": "location", "type": "geopoint"},
           {"facet": true, "name": "tableFilename", "type": "string"}
         ]
       }'

curl "$TYPESENSE_HOST/collections" \
       -X POST \
       -H "Content-Type: application/json" \
       -H "X-TYPESENSE-API-KEY: ${TYPESENSE_ADMIN_KEY}" \
       -d '{
         "name": "unstructured_uk",
         "enable_nested_fields": true,
         "fields": [
           {"dynamic": true, "locale": "uk", "name": "data", "optional": false, "type": "object"},
           {"name": "location", "type": "geopoint"},
           {"facet": true, "name": "tableFilename", "type": "string"}
         ]
       }'