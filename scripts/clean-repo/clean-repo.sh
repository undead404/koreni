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
if [ -d ./search-middleware/node_modules ]; then rm -rf ./search-middleware/node_modules; fi
if [ -d ./search-middleware/dist ]; then rm -rf ./search-middleware/dist; fi
