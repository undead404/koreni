#!/usr/bin/env bash

source .env

echo $NEXT_PUBLIC_TYPESENSE_HOST

curl "$NEXT_PUBLIC_TYPESENSE_HOST/keys" \
    -X POST \
    -H "X-TYPESENSE-API-KEY: $TYPESENSE_BOOTSTRAP_KEY" \
    -H 'Content-Type: application/json' \
    -d '{"description":"Admin key.","actions": ["*"], "collections": ["*"]}'