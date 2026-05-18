#!/usr/bin/env bash

source .env

curl -H "X-TYPESENSE-API-KEY: ${TYPESENSE_ADMIN_KEY}" -X DELETE \
    "$NEXT_PUBLIC_TYPESENSE_HOST/collections/unstructured_pl/documents?filter_by=tableId:DASO-R7720-5-26"

