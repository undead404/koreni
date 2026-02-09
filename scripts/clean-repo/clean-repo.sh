#!/usr/bin/env bash

# dependencies
if [ -d ./node_modules ]; then rm -rf ./node_modules; fi

# env
if [ -s .env ]; then rm .env; fi

# next
if [ -s next-env.d.ts ]; then rm next-env.d.ts; fi
if [ -d ./.next ]; then rm -rf ./.next; fi
if [ -d ./out ]; then rm -rf ./out; fi

# typesense, search
if [ -d ./typesense ]; then rm -rf ./typesense; fi