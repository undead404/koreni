#!/usr/bin/env bash

source .env
    
mkdir "$(pwd)"/typesense-data

docker run -p 8108:8108 \
            -v"$(pwd)"/typesense-data:/data typesense/typesense:28.0 \
            --data-dir /data \
            --api-key=$TYPESENSE_BOOTSTRAP_KEY \
            --enable-cors
