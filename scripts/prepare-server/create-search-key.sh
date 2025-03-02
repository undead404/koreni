#!/usr/bin/env bash

source .env

curl "$TYPESENSE_HOST/keys" \
    -X POST \
    -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY" \
    -H 'Content-Type: application/json' \
    -d '{"actions": ["documents:search"], "collections": ["*"], "description":"Search-only key."}'