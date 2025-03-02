#!/usr/bin/env bash

source .env


curl -H "X-TYPESENSE-API-KEY: ${TYPESENSE_SEARCH_KEY}" \
"${TYPESENSE_HOST}/collections/unstructured_uk/documents/search\
?q=Бабич&query_by=data.*&per_page=1&page=1"