#!/bin/bash

# Suppress interactive prompts and ensure deterministic output
export CI=true 

ERROR_PAYLOAD=""
EXIT_CODE=0

# 1. Root Typecheck
ROOT_TSC=$(yarn tsc --noEmit 2>&1)
if [ $? -ne 0 ]; then
  ERROR_PAYLOAD+="\n=== Root tsc errors ===\n$ROOT_TSC\n"
  EXIT_CODE=1
fi

# 2. Server Typecheck (Subshell execution isolates state)
SERVER_TSC=$( (cd src/server && yarn tsc --noEmit 2>&1) )
if [ $? -ne 0 ]; then
  ERROR_PAYLOAD+="\n=== Server tsc errors ===\n$SERVER_TSC\n"
  EXIT_CODE=1
fi

# 3. ESLint with Auto-fix
if [ $# -eq 0 ]; then
  LINT_OUT=$(yarn eslint . --fix 2>&1)
else
  LINT_OUT=$(yarn eslint "$@" --fix 2>&1)
fi

if [ $? -ne 0 ]; then
  ERROR_PAYLOAD+="\n=== ESLint errors ===\n$LINT_OUT\n"
  EXIT_CODE=1
fi

# Final Output Delivery
if [ $EXIT_CODE -ne 0 ]; then
  echo -e "$ERROR_PAYLOAD"
  exit $EXIT_CODE
else
  echo "ALL_CHECKS_PASSED"
  exit 0
fi