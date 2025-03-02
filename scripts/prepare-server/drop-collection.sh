#!/usr/bin/env bash

source .env

curl -H "X-TYPESENSE-API-KEY: ${TYPESENSE_ADMIN_KEY}" \
     -X DELETE \
    "$TYPESENSE_HOST/collections/unstructured_ru"

curl -H "X-TYPESENSE-API-KEY: ${TYPESENSE_ADMIN_KEY}" \
     -X DELETE \
    "$TYPESENSE_HOST/collections/unstructured_uk"