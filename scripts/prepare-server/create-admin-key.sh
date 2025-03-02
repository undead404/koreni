#!/usr/bin/env bash

source .env

echo $TYPESENSE_HOST

curl "$TYPESENSE_HOST/keys" \
    -X POST \
    -H "X-TYPESENSE-API-KEY: $TYPESENSE_BOOTSTRAP_KEY" \
    -H 'Content-Type: application/json' \
    -d '{"description":"Admin key.","actions": ["*"], "collections": ["*"]}'