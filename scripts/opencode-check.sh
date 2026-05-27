#!/bin/bash

echo "[tsc] Running project-wide typecheck..."
yarn tsc --noEmit
TSC_STATUS=$?

if [ $TSC_STATUS -ne 0 ]; then
  exit $TSC_STATUS
fi

echo "[tsc] Running server-side typecheck..."
cd src/server

yarn tsc --noEmit
TSC_STATUS=$?

cd ../..

if [ $TSC_STATUS -ne 0 ]; then
  exit $TSC_STATUS
fi

if [ $# -eq 0 ]; then
  echo "[eslint] No files passed. Linting entire project..."
  yarn eslint . --fix
else
  echo "[eslint] Linting specific files..."
  yarn eslint "$@" --fix
fi